import {
  Bsda,
  BsdaRevisionRequest,
  BsdaRevisionRequestApproval,
  BsdaStatus,
  BsdaType,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import { removeEmpty } from "../../../common/converter";
import {
  LogMetadata,
  PrismaTransaction,
  RepositoryFnDeps,
  RepositoryTransaction
} from "../../../common/repository/types";
import { PARTIAL_OPERATIONS } from "../../validation/constants";
import {
  isOnlyAboutFields,
  NON_CANCELLABLE_BSDA_STATUSES
} from "../../resolvers/mutations/revisionRequest/createRevisionRequest";
import { ForbiddenError } from "../../../common/errors";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { operationHook } from "../../operationHook";
import { isFinalOperationCode } from "../../../common/operationCodes";
import { sendMail } from "../../../mailer/mailing";
import { isDefined } from "../../../common/helpers";
import {
  bsdaWasteSealNumbersOrPackagingsRevision,
  MessageVersion,
  renderMail
} from "@td/mail";
import { PACKAGINGS_NAMES } from "../../utils";
import { prisma } from "@td/prisma";

export type AcceptRevisionRequestApprovalFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string | null },
  logMetadata?: LogMetadata
) => Promise<void>;

/**
 * Si l'émetteur (resp éco-organisme) approuve
 * sa voix compte comme celle de l'éco-organisme (resp émetteur)
 */
async function handleEcoOrganismeApprovals(
  prisma: RepositoryTransaction,
  approval: BsdaRevisionRequestApproval & {
    revisionRequest: BsdaRevisionRequest;
  }
) {
  const bsda = await prisma.bsda.findUniqueOrThrow({
    where: { id: approval.revisionRequest.bsdaId }
  });

  if (bsda.emitterCompanySiret && bsda.ecoOrganismeSiret) {
    // Il y a à la fois un émetteur et un éco-organisme

    let otherApproval: BsdaRevisionRequestApproval | null = null;

    if (approval.approverSiret === bsda.emitterCompanySiret) {
      // L'émetteur approuve, il faut également approuver pour
      // l'éco-organisme
      otherApproval = await prisma.bsdaRevisionRequestApproval.findFirst({
        where: {
          revisionRequestId: approval.revisionRequestId,
          approverSiret: bsda.ecoOrganismeSiret
        }
      });
    }

    if (approval.approverSiret === bsda.ecoOrganismeSiret) {
      // L'éco-organisme approuve, il faut également approuver pour
      // l'émetteur
      otherApproval = await prisma.bsdaRevisionRequestApproval.findFirst({
        where: {
          revisionRequestId: approval.revisionRequestId,
          approverSiret: bsda.emitterCompanySiret
        }
      });
    }

    if (otherApproval) {
      await prisma.bsdaRevisionRequestApproval.update({
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
          type: "BsdaRevisionRequestAccepted",
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
}

export function buildAcceptRevisionRequestApproval(
  deps: RepositoryFnDeps
): AcceptRevisionRequestApprovalFn {
  return async (revisionRequestApprovalId, { comment }, logMetadata) => {
    const { prisma, user } = deps;

    const updatedApproval = await prisma.bsdaRevisionRequestApproval.update({
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
        type: "BsdaRevisionRequestAccepted",
        data: {
          status: RevisionRequestApprovalStatus.ACCEPTED,
          comment
        },
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    await handleEcoOrganismeApprovals(prisma, updatedApproval);

    // If it was the last approval:
    // - mark the revision as approved
    // - apply the revision to the Bsda
    const remainingApprovals = await prisma.bsdaRevisionRequestApproval.count({
      where: {
        revisionRequestId: updatedApproval.revisionRequestId,
        status: RevisionRequestApprovalStatus.PENDING
      }
    });
    if (remainingApprovals > 0) return;

    await approveAndApplyRevisionRequest(updatedApproval.revisionRequestId, {
      prisma,
      user,
      logMetadata
    });
  };
}

async function getUpdateFromRevisionRequest(
  bsdaBeforeRevision: Bsda,
  revisionRequest: BsdaRevisionRequest,
  prisma: PrismaTransaction
) {
  const { status: currentStatus } = await prisma.bsda.findUniqueOrThrow({
    where: { id: revisionRequest.bsdaId },
    select: { status: true }
  });
  const newStatus = getNewStatus(
    currentStatus,
    revisionRequest.destinationOperationCode,
    revisionRequest.isCanceled
  );

  const hasTTR = Boolean(
    bsdaBeforeRevision.destinationOperationNextDestinationCompanySiret
  );

  const result = removeEmpty({
    wasteCode: revisionRequest.wasteCode,
    wastePop: revisionRequest.wastePop,
    packagings: revisionRequest.packagings,
    wasteSealNumbers: revisionRequest.wasteSealNumbers,
    wasteMaterialName: revisionRequest.wasteMaterialName,
    // Attention, quand on a ajoute un TTR à un bsda il se retrouve dans destinationXXX,
    // et l'exutoire est bougé dans destinationOperationNextDestinationXXX
    // Les révisions n'autorisent que la modification du CAP de l'exutoire, qui est
    // systématiquement dans le champ destinationCAP
    destinationCap: hasTTR ? null : revisionRequest.destinationCap,
    destinationOperationNextDestinationCap: hasTTR
      ? revisionRequest.destinationCap
      : null,
    destinationReceptionWeight: revisionRequest.destinationReceptionWeight,
    destinationOperationCode: revisionRequest.destinationOperationCode,
    destinationOperationDescription:
      revisionRequest.destinationOperationDescription,
    destinationOperationMode: revisionRequest.destinationOperationMode,
    brokerCompanyName: revisionRequest.brokerCompanyName,
    brokerCompanySiret: revisionRequest.brokerCompanySiret,
    brokerCompanyAddress: revisionRequest.brokerCompanyAddress,
    brokerCompanyContact: revisionRequest.brokerCompanyContact,
    brokerCompanyPhone: revisionRequest.brokerCompanyPhone,
    brokerCompanyMail: revisionRequest.brokerCompanyMail,
    brokerRecepisseNumber: revisionRequest.brokerRecepisseNumber,
    brokerRecepisseDepartment: revisionRequest.brokerRecepisseDepartment,
    brokerRecepisseValidityLimit:
      revisionRequest.brokerRecepisseValidityLimit?.toISOString(),
    emitterPickupSiteName: revisionRequest.emitterPickupSiteName,
    emitterPickupSiteAddress: revisionRequest.emitterPickupSiteAddress,
    emitterPickupSiteCity: revisionRequest.emitterPickupSiteCity,
    emitterPickupSitePostalCode: revisionRequest.emitterPickupSitePostalCode,
    emitterPickupSiteInfos: revisionRequest.emitterPickupSiteInfos,
    status: newStatus
  });

  // Careful. Some operation codes explicitely need a null operation mode (ex: D15)
  if (
    revisionRequest.destinationOperationCode &&
    !revisionRequest.destinationOperationMode
  ) {
    return {
      ...result,
      destinationOperationMode: null
    };
  }

  return result;
}

function getNewStatus(
  status: BsdaStatus,
  newOperationCode: string | null,
  isCanceled = false
): BsdaStatus {
  if (isCanceled) {
    if (NON_CANCELLABLE_BSDA_STATUSES.includes(status)) {
      throw new ForbiddenError(
        "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
      );
    }

    return BsdaStatus.CANCELED;
  }

  if (
    status === BsdaStatus.PROCESSED &&
    newOperationCode &&
    PARTIAL_OPERATIONS.includes(newOperationCode)
  ) {
    return BsdaStatus.AWAITING_CHILD;
  }

  if (
    status === BsdaStatus.AWAITING_CHILD &&
    newOperationCode &&
    !PARTIAL_OPERATIONS.includes(newOperationCode)
  ) {
    return BsdaStatus.PROCESSED;
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
): Promise<BsdaRevisionRequest> {
  const { prisma, user, logMetadata } = context;

  const updatedRevisionRequest = await prisma.bsdaRevisionRequest.update({
    where: { id: revisionRequestId },
    data: { status: RevisionRequestStatus.ACCEPTED },
    include: { approvals: true }
  });

  const bsdaBeforeRevision = await prisma.bsda.findUniqueOrThrow({
    where: { id: updatedRevisionRequest.bsdaId }
  });
  const updateData = await getUpdateFromRevisionRequest(
    bsdaBeforeRevision,
    updatedRevisionRequest,
    prisma
  );

  if (!updateData) {
    throw new Error(
      `Empty BSDA revision cannot be applied. Id #${updatedRevisionRequest.id}, BSDA id #${updatedRevisionRequest.bsdaId}`
    );
  }

  const updatedBsda = await prisma.bsda.update({
    where: { id: updatedRevisionRequest.bsdaId },
    data: { ...updateData }
  });

  if (updateData && updateData.destinationOperationCode) {
    const beforeRevisionOperationIsFinal = isFinalOperationCode(
      bsdaBeforeRevision.destinationOperationCode
    );
    const updatedOperationIsFinal = isFinalOperationCode(
      updateData.destinationOperationCode
    );
    if (updatedOperationIsFinal && !beforeRevisionOperationIsFinal) {
      prisma.addAfterCommitCallback?.(async () => {
        await operationHook(updatedBsda, { runSync: false });
      });
    } else if (!updatedOperationIsFinal && beforeRevisionOperationIsFinal) {
      await prisma.bsdaFinalOperation.deleteMany({
        where: { finalBsdaId: updatedBsda.id }
      });
    }
  }

  await prisma.event.create({
    data: {
      streamId: updatedRevisionRequest.bsdaId,
      actor: user.id,
      type: "BsdaRevisionRequestApplied",
      data: {
        content: updateData,
        revisionRequestId: updatedRevisionRequest.id
      },
      metadata: { ...logMetadata, authType: user.auth }
    }
  });

  if (updateData.status === BsdaStatus.CANCELED) {
    // Detach BSDs in a forward relationship
    await prisma.bsda.update({
      where: { id: updatedBsda.id },
      data: { forwardingId: null }
    });

    // If the bsda was a grouping bsda, and is cancelled, free the children
    await prisma.bsda.updateMany({
      where: { groupedInId: updatedBsda.id },
      data: {
        groupedInId: null
      }
    });
  }

  // We might need to send an email to the emitter
  await sendEmailWhenRevisionOnSealNumbersOrPackagings(
    bsdaBeforeRevision,
    updatedBsda,
    updatedRevisionRequest
  );

  prisma.addAfterCommitCallback?.(() =>
    enqueueUpdatedBsdToIndex(updatedRevisionRequest.bsdaId)
  );

  return updatedRevisionRequest;
}

const getEmitterCompanyId = async bsda => {
  if (bsda.emitterCompanySiret) {
    const emitterCompany = await prisma.company.findFirstOrThrow({
      where: { orgId: bsda.emitterCompanySiret },
      select: { id: true }
    });

    return emitterCompany.id;
  }

  return null;
};

/**
 * Si la révision s'est jouée entre l'entreprise de travaux et la destination,
 * pour les champs wasteSealNumbers et wasteMaterialName, on prévient
 * l'émetteur par mail
 */
const sendEmailWhenRevisionOnSealNumbersOrPackagings = async (
  bsdaBeforeRevision,
  bsdaAfterRevision,
  updatedRevisionRequest
) => {
  const shouldSendMail =
    bsdaAfterRevision.type === BsdaType.OTHER_COLLECTIONS &&
    isDefined(bsdaAfterRevision.emitterCompanySiret) &&
    isDefined(bsdaAfterRevision.workerCompanySiret) &&
    isDefined(bsdaAfterRevision.destinationCompanySiret) &&
    !updatedRevisionRequest.isCanceled &&
    isOnlyAboutFields(bsdaAfterRevision, [
      "status", // le status peut se glisser dans l'update, attention
      "wasteSealNumbers",
      "packagings"
    ]) &&
    updatedRevisionRequest.authoringCompanyId !==
      (await getEmitterCompanyId(bsdaBeforeRevision));

  if (!shouldSendMail) return;

  const companies = await prisma.company.findMany({
    where: {
      orgId: {
        in: [
          bsdaAfterRevision.emitterCompanySiret ?? "",
          bsdaAfterRevision.workerCompanySiret ?? "",
          bsdaAfterRevision.destinationCompanySiret ?? ""
        ]
      }
    },
    select: {
      id: true,
      orgId: true
    }
  });

  const emitterCompany = companies.find(
    company => company.orgId === bsdaAfterRevision.emitterCompanySiret
  );
  const workerCompany = companies.find(
    company => company.orgId === bsdaAfterRevision.workerCompanySiret
  );
  const destinationCompany = companies.find(
    company => company.orgId === bsdaAfterRevision.destinationCompanySiret
  );

  const companyAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: { in: companies.map(company => company.id) },
      notificationIsActiveBsdaFinalDestinationUpdate: true
    },
    include: {
      user: true
    }
  });

  const emitterCompanyAssociations = companyAssociations.filter(
    association => association.companyId === emitterCompany?.id
  );
  const workerCompanyAssociations = companyAssociations.filter(
    association => association.companyId === workerCompany?.id
  );
  const destinationCompanyAssociations = companyAssociations.filter(
    association => association.companyId === destinationCompany?.id
  );

  if (emitterCompanyAssociations?.length) {
    const messageVersion: MessageVersion = {
      to: emitterCompanyAssociations
        .filter(association => association.companyId === emitterCompany?.id)
        .map(association => ({
          name: association.user.name,
          email: association.user.email
        }))
    };

    const worker = {
      name: bsdaAfterRevision.workerCompanyName,
      siret: bsdaAfterRevision.workerCompanySiret
    };
    const destination = {
      name: bsdaAfterRevision.destinationCompanyName,
      siret: bsdaAfterRevision.destinationCompanySiret
    };

    const approverSiret = updatedRevisionRequest.approvals.find(
      approval => approval.approverSiret
    )?.approverSiret;
    const approver = worker.siret === approverSiret ? worker : destination;
    const author = worker.siret === approver.siret ? destination : worker;

    const packagingsToString = packagings =>
      packagings
        ?.map(
          p => `${p.quantity} x ${PACKAGINGS_NAMES[p.type]}${p.other ?? ""}`
        )
        ?.join(", ");

    let wasteSealNumbersBeforeRevision, wasteSealNumbersAfterRevision;
    if (updatedRevisionRequest.wasteSealNumbers?.length !== 0) {
      wasteSealNumbersBeforeRevision =
        bsdaBeforeRevision.wasteSealNumbers?.join(", ");
      wasteSealNumbersAfterRevision =
        bsdaAfterRevision.wasteSealNumbers?.join(", ");
    }

    let packagingsBeforeRevision, packagingsAfterRevision;
    if (isDefined(updatedRevisionRequest.packagings)) {
      packagingsBeforeRevision = packagingsToString(
        bsdaBeforeRevision.packagings
      );
      packagingsAfterRevision = packagingsToString(
        bsdaAfterRevision.packagings
      );
    }

    const payload = renderMail(bsdaWasteSealNumbersOrPackagingsRevision, {
      variables: {
        bsdaId: bsdaAfterRevision.id,
        author,
        approver,
        worker,
        destination,
        wasteSealNumbersBeforeRevision,
        wasteSealNumbersAfterRevision,
        packagingsBeforeRevision,
        packagingsAfterRevision
      },
      messageVersions: [messageVersion],
      cc: [
        ...workerCompanyAssociations
          .filter(association => association.companyId === workerCompany?.id)
          .map(association => ({
            name: association.user.name,
            email: association.user.email
          })),
        ...destinationCompanyAssociations
          .filter(
            association => association.companyId === destinationCompany?.id
          )
          .map(association => ({
            name: association.user.name,
            email: association.user.email
          }))
      ]
    });

    await sendMail(payload);
  }
};
