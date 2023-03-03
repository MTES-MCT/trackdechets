import {
  BsddRevisionRequest,
  Form,
  Prisma,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus,
  Status
} from "@prisma/client";
import { PROCESSING_OPERATIONS_GROUPEMENT_CODES } from "../../../common/constants";
import { removeEmpty } from "../../../common/converter";
import {
  LogMetadata,
  PrismaTransaction,
  RepositoryFnDeps,
  RepositoryTransaction
} from "../../../common/repository/types";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";
import { NON_CANCELLABLE_BSDD_STATUSES } from "../../resolvers/mutations/createFormRevisionRequest";
import { ForbiddenError } from "apollo-server-core";

export type AcceptRevisionRequestApprovalFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string },
  logMetadata?: LogMetadata
) => Promise<void>;

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
      }
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
    Partial<Prisma.FormUpdateInput>,
    Partial<Prisma.FormUpdateWithoutForwardingInput>
  ]
> {
  const { status: currentStatus } = await prisma.form.findUnique({
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
    wasteDetailsCode: revisionRequest.wasteDetailsCode,
    wasteDetailsName: revisionRequest.wasteDetailsName,
    wasteDetailsPop: revisionRequest.wasteDetailsPop,
    wasteDetailsPackagingInfos: revisionRequest.wasteDetailsPackagingInfos,
    ...(hasTempStorage
      ? {
          quantityReceived:
            revisionRequest.temporaryStorageTemporaryStorerQuantityReceived
        }
      : {
          quantityReceived: revisionRequest.quantityReceived,
          processingOperationDone: revisionRequest.processingOperationDone,
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

  return [removeEmpty(bsddUpdate), removeEmpty(forwardedInUpdate)];
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

  const revisionRequest = await prisma.bsddRevisionRequest.findUnique({
    where: { id: revisionRequestId },
    include: { bsdd: true }
  });

  const updatedRevisionRequest = await prisma.bsddRevisionRequest.update({
    where: { id: revisionRequest.id },
    data: { status: RevisionRequestStatus.ACCEPTED }
  });
  const [bsddUpdate, forwardedInUpdate] =
    await getUpdateFromFormRevisionRequest(revisionRequest, prisma);

  const updatedBsdd = await prisma.form.update({
    where: { id: revisionRequest.bsddId },
    data: {
      ...bsddUpdate,
      ...(forwardedInUpdate && {
        forwardedIn: { update: { ...forwardedInUpdate } }
      })
    },
    select: { readableId: true }
  });

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

  prisma.addAfterCommitCallback(() =>
    enqueueBsdToIndex(updatedBsdd.readableId)
  );

  return updatedRevisionRequest;
}

export default buildAcceptRevisionRequestApproval;
