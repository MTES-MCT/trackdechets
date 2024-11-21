import {
  BsddRevisionRequest,
  Form,
  Prisma,
  RevisionRequestApprovalStatus,
  BsddRevisionRequestApproval,
  RevisionRequestStatus,
  Status,
  EmitterType
} from "@prisma/client";
import {
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
  isDangerous
} from "@td/constants";
import { removeEmpty } from "../../../common/converter";
import {
  LogMetadata,
  PrismaTransaction,
  RepositoryFnDeps,
  RepositoryTransaction
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { NON_CANCELLABLE_BSDD_STATUSES } from "../../resolvers/mutations/createFormRevisionRequest";
import buildRemoveAppendix2 from "../form/removeAppendix2";
import { distinct } from "../../../common/arrays";
import { ForbiddenError } from "../../../common/errors";
import { isFinalOperationCode } from "../../../common/operationCodes";
import { operationHook } from "../../operationHook";
import { areDefined } from "../../../common/helpers";

export type AcceptRevisionRequestApprovalFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string | null },
  logMetadata?: LogMetadata
) => Promise<void>;

/**
 *
 * We have to handle eco organismes which might be present on bsdd:
 * Retrieve form
 * Get producer sirets: emitter + eco-organisme if present
 * If we have both, 2 pending approvals were generated, one is already accepted
 * Update the remaining approval to automatically accept it
 */
const handleEcoOrganismeApprovals = async (
  prisma: RepositoryTransaction,
  updatedApproval: BsddRevisionRequestApproval & {
    revisionRequest: BsddRevisionRequest;
  }
) => {
  const bsd = await prisma.form.findUnique({
    where: { id: updatedApproval.revisionRequest.bsddId }
  });
  const approverSiret = updatedApproval.approverSiret;

  const producerSirets = distinct(
    [bsd?.emitterCompanySiret, bsd?.ecoOrganismeSiret].filter(Boolean)
  );
  if (producerSirets.length > 1 && producerSirets.includes(approverSiret)) {
    const otherSiret = producerSirets.filter(
      siret => siret !== approverSiret
    )[0];

    const otherApproval = await prisma.bsddRevisionRequestApproval.findFirst({
      where: {
        revisionRequestId: updatedApproval.revisionRequest.id,
        approverSiret: otherSiret
      }
    });
    if (otherApproval) {
      await prisma.bsddRevisionRequestApproval.update({
        where: {
          id: otherApproval.id
        },
        data: {
          status: RevisionRequestApprovalStatus.ACCEPTED,
          comment: "Auto approval"
        }
      });

      await prisma.event.create({
        data: {
          streamId: otherApproval.revisionRequestId,
          actor: "system",
          type: "BsddRevisionRequestAccepted",
          data: {
            content: {
              status: RevisionRequestApprovalStatus.ACCEPTED,
              comment: "Auto"
            }
          }
        }
      });
    }
  }
};

const buildAcceptRevisionRequestApproval: (
  deps: RepositoryFnDeps
) => AcceptRevisionRequestApprovalFn =
  deps =>
  async (revisionRequestApprovalId, { comment }, logMetadata) => {
    const { prisma, user } = deps;

    const updatedApproval = await prisma.bsddRevisionRequestApproval.update({
      where: { id: revisionRequestApprovalId },
      data: {
        status: RevisionRequestApprovalStatus.ACCEPTED,
        comment
      },
      include: { revisionRequest: true }
    });
    await prisma.event.create({
      data: {
        streamId: updatedApproval.revisionRequestId,
        actor: user.id,
        type: "BsddRevisionRequestAccepted",
        data: {
          content: {
            status: RevisionRequestApprovalStatus.ACCEPTED,
            comment
          }
        },
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // when eco organisme is present on bsdd
    await handleEcoOrganismeApprovals(prisma, updatedApproval);

    // If it was the last approval:
    // - mark the revision as approved
    // - apply the revision to the BSDD
    const remainingApprovals = await prisma.bsddRevisionRequestApproval.count({
      where: {
        revisionRequestId: updatedApproval.revisionRequestId,
        status: RevisionRequestApprovalStatus.PENDING
      }
    });

    if (remainingApprovals !== 0) return;

    await approveAndApplyRevisionRequest(updatedApproval.revisionRequestId, {
      prisma,
      user,
      logMetadata
    });
  };

async function getUpdateFromFormRevisionRequest(
  revisionRequest: BsddRevisionRequest & { bsdd: Form },
  prisma: PrismaTransaction
): Promise<
  [
    Partial<Prisma.FormUpdateInput> | null,
    Partial<Prisma.FormUpdateWithoutForwardingInput> | null
  ]
> {
  const { status: currentStatus } = await prisma.form.findUniqueOrThrow({
    where: { id: revisionRequest.bsddId },
    select: { status: true }
  });

  const hasTempStorage = !!revisionRequest.bsdd.forwardedInId;

  const bsddUpdate: Prisma.FormUpdateInput = {
    status: getNewStatus(
      currentStatus,
      revisionRequest.processingOperationDone,
      revisionRequest.isCanceled
    ),
    recipientCap: revisionRequest.recipientCap,
    ...(revisionRequest.wasteDetailsCode !== null && {
      wasteDetailsCode: revisionRequest.wasteDetailsCode,
      wasteDetailsIsDangerous: isDangerous(revisionRequest.wasteDetailsCode)
    }),
    wasteDetailsName: revisionRequest.wasteDetailsName,
    ...(revisionRequest.wasteDetailsPop !== null && {
      wasteDetailsPop: revisionRequest.wasteDetailsPop
    }),
    wasteDetailsQuantity: revisionRequest.wasteDetailsQuantity,
    wasteDetailsSampleNumber: revisionRequest.wasteDetailsSampleNumber,
    ...(revisionRequest.wasteDetailsPackagingInfos && {
      wasteDetailsPackagingInfos: revisionRequest.wasteDetailsPackagingInfos
    }),
    ...(hasTempStorage
      ? {
          quantityReceived:
            revisionRequest.temporaryStorageTemporaryStorerQuantityReceived
        }
      : {
          quantityReceived: revisionRequest.quantityReceived,
          quantityRefused: revisionRequest.quantityRefused,
          wasteAcceptationStatus: revisionRequest.wasteAcceptationStatus,
          wasteRefusalReason: revisionRequest.wasteRefusalReason,
          processingOperationDone: revisionRequest.processingOperationDone,
          destinationOperationMode: revisionRequest.destinationOperationMode,
          processingOperationDescription:
            revisionRequest.processingOperationDescription
        }),
    brokerCompanyName: revisionRequest.brokerCompanyName,
    brokerCompanySiret: revisionRequest.brokerCompanySiret,
    brokerCompanyAddress: revisionRequest.brokerCompanyAddress,
    brokerCompanyContact: revisionRequest.brokerCompanyContact,
    brokerCompanyPhone: revisionRequest.brokerCompanyPhone,
    brokerCompanyMail: revisionRequest.brokerCompanyMail,
    brokerReceipt: revisionRequest.brokerReceipt,
    brokerDepartment: revisionRequest.brokerDepartment,
    brokerValidityLimit: revisionRequest.brokerValidityLimit,
    traderCompanyName: revisionRequest.traderCompanyName,
    traderCompanySiret: revisionRequest.traderCompanySiret,
    traderCompanyAddress: revisionRequest.traderCompanyAddress,
    traderCompanyContact: revisionRequest.traderCompanyContact,
    traderCompanyPhone: revisionRequest.traderCompanyPhone,
    traderCompanyMail: revisionRequest.traderCompanyMail,
    traderReceipt: revisionRequest.traderReceipt,
    traderDepartment: revisionRequest.traderDepartment,
    traderValidityLimit: revisionRequest.traderValidityLimit
  };

  const forwardedInUpdate: Prisma.FormUpdateInput = hasTempStorage
    ? {
        recipientCap: revisionRequest.temporaryStorageDestinationCap,
        recipientProcessingOperation:
          revisionRequest.temporaryStorageDestinationProcessingOperation,
        quantityReceived: revisionRequest.quantityReceived,
        processingOperationDone: revisionRequest.processingOperationDone,
        processingOperationDescription:
          revisionRequest.processingOperationDescription,
        wasteDetailsQuantity:
          revisionRequest.temporaryStorageTemporaryStorerQuantityReceived
      }
    : {};

  if (isFinalOperationCode(revisionRequest.processingOperationDone)) {
    // No traceability must be false
    bsddUpdate.noTraceability = false;

    // Next destination must be null
    bsddUpdate.nextDestinationCompanyName = "";
    bsddUpdate.nextDestinationCompanySiret = "";
    bsddUpdate.nextDestinationCompanyAddress = "";
    bsddUpdate.nextDestinationCompanyContact = "";
    bsddUpdate.nextDestinationCompanyPhone = "";
    bsddUpdate.nextDestinationCompanyMail = "";
    bsddUpdate.nextDestinationCompanyCountry = "";
    bsddUpdate.nextDestinationCompanyVatNumber = "";
    bsddUpdate.nextDestinationNotificationNumber = "";
    bsddUpdate.nextDestinationProcessingOperation = "";

    if (bsddUpdate.status === Status.NO_TRACEABILITY) {
      bsddUpdate.status = Status.PROCESSED;
    }
  }

  // Remove empty keys
  const emptyBsddUpdate = removeEmpty(bsddUpdate);
  const emptyForwardedInUpdate = removeEmpty(forwardedInUpdate);

  // Careful. Some operation codes explicitely need a null operation mode (ex: D15)
  if (
    bsddUpdate.processingOperationDone &&
    !bsddUpdate.destinationOperationMode
  ) {
    return [
      {
        ...emptyBsddUpdate,
        destinationOperationMode: null
      },
      emptyForwardedInUpdate
    ];
  }

  return [emptyBsddUpdate, emptyForwardedInUpdate];
}

function getNewStatus(
  status: Status,
  newOperationCode: string | null,
  isCanceled = false
): Status {
  if (isCanceled) {
    if (NON_CANCELLABLE_BSDD_STATUSES.includes(status)) {
      throw new ForbiddenError(
        "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
      );
    }

    return Status.CANCELED;
  }

  if (
    status === Status.PROCESSED &&
    newOperationCode &&
    PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(newOperationCode)
  ) {
    return Status.AWAITING_GROUP;
  }

  if (
    status === Status.AWAITING_GROUP &&
    newOperationCode &&
    !PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(newOperationCode)
  ) {
    return Status.PROCESSED;
  }

  return status;
}

export async function approveAndApplyRevisionRequest(
  revisionRequestId: string,
  context: {
    prisma: RepositoryTransaction;
    user: Express.User;
    logMetadata?: LogMetadata;
  }
): Promise<BsddRevisionRequest> {
  const { prisma, user, logMetadata } = context;

  const revisionRequest = await prisma.bsddRevisionRequest.findUniqueOrThrow({
    where: { id: revisionRequestId },
    include: { bsdd: true }
  });

  const updatedRevisionRequest = await prisma.bsddRevisionRequest.update({
    where: { id: revisionRequest.id },
    data: { status: RevisionRequestStatus.ACCEPTED }
  });
  const [bsddUpdate, forwardedInUpdate] =
    await getUpdateFromFormRevisionRequest(revisionRequest, prisma);

  const bsddBeforeRevision = await prisma.form.findUniqueOrThrow({
    where: { id: revisionRequest.bsddId }
  });

  const updatedBsdd = await prisma.form.update({
    where: { id: revisionRequest.bsddId },
    data: {
      ...bsddUpdate,
      ...(forwardedInUpdate && {
        forwardedIn: { update: { ...forwardedInUpdate } }
      })
    },
    include: {
      grouping: {
        select: { initialForm: { select: { readableId: true } } }
      }
    }
  });

  if (bsddUpdate && bsddUpdate.processingOperationDone) {
    const beforeRevisionOperationIsFinal = isFinalOperationCode(
      bsddBeforeRevision.processingOperationDone
    );
    const updatedOperationIsFinal = isFinalOperationCode(
      updatedBsdd.processingOperationDone
    );
    if (updatedOperationIsFinal && !beforeRevisionOperationIsFinal) {
      prisma.addAfterCommitCallback?.(async () => {
        await operationHook(updatedBsdd, { runSync: false });
      });
    } else if (!updatedOperationIsFinal && beforeRevisionOperationIsFinal) {
      await prisma.bsddFinalOperation.deleteMany({
        where: { finalFormId: updatedBsdd.id }
      });
    }
  }

  // Revision targeted an ANNEXE_1 (child). We need to update its parent
  if (updatedBsdd.emitterType === EmitterType.APPENDIX1_PRODUCER) {
    // Quantity changed. We need to fix parent's quantity as well
    if (
      areDefined(
        bsddBeforeRevision.wasteDetailsQuantity,
        revisionRequest.wasteDetailsQuantity
      )
    ) {
      // Calculate revision diff
      const diff = bsddBeforeRevision
        .wasteDetailsQuantity!.minus(revisionRequest.wasteDetailsQuantity!)
        .toDecimalPlaces(6);
      const { nextForm: parent } = await prisma.formGroupement.findFirstOrThrow(
        {
          where: { initialFormId: bsddBeforeRevision.id },
          include: {
            nextForm: true
          }
        }
      );

      // Calculate parent new quantity using diff
      const parentNewQuantity = parent.wasteDetailsQuantity
        ?.minus(diff)
        .toDecimalPlaces(6);

      // Update & re-index parent
      await prisma.form.update({
        where: { id: parent.id },
        data: {
          wasteDetailsQuantity: parentNewQuantity
        }
      });
      prisma.addAfterCommitCallback?.(() => {
        enqueueUpdatedBsdToIndex(parent.readableId);
      });
    }
  }

  if (updatedBsdd.emitterType === EmitterType.APPENDIX1) {
    const { wasteDetailsCode, wasteDetailsName, wasteDetailsPop } =
      revisionRequest;
    const appendix1ProducerUpdate = {
      ...(wasteDetailsCode && { wasteDetailsCode }),
      ...(wasteDetailsName && { wasteDetailsName }),
      ...(wasteDetailsPop && { wasteDetailsPop })
    };
    const appendix1ProducerIds = updatedBsdd.grouping.map(
      g => g.initialForm.readableId
    );

    if (Object.keys(appendix1ProducerUpdate).length > 0) {
      await prisma.form.updateMany({
        where: { readableId: { in: appendix1ProducerIds } },
        data: appendix1ProducerUpdate
      });
      prisma.addAfterCommitCallback?.(() => {
        for (const readableId in appendix1ProducerIds) {
          enqueueUpdatedBsdToIndex(readableId);
        }
      });
    }
  }

  if (revisionRequest.isCanceled) {
    // Disconnect appendix2 forms if any
    const removeAppendix2 = buildRemoveAppendix2({ prisma, user });
    await removeAppendix2(revisionRequest.bsddId);
  }

  await prisma.event.create({
    data: {
      streamId: revisionRequest.bsddId,
      actor: user.id,
      type: "BsddRevisionRequestApplied",
      data: {
        content: bsddUpdate,
        revisionRequestId: revisionRequest.id
      } as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }
  });

  prisma.addAfterCommitCallback?.(() =>
    enqueueUpdatedBsdToIndex(updatedBsdd.readableId)
  );

  return updatedRevisionRequest;
}

export default buildAcceptRevisionRequestApproval;
