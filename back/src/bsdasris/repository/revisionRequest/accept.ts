import {
  BsdasriRevisionRequest,
  BsdasriRevisionRequestApproval,
  BsdasriStatus,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@td/prisma";
import { removeEmpty } from "../../../common/converter";
import {
  LogMetadata,
  PrismaTransaction,
  RepositoryFnDeps,
  RepositoryTransaction
} from "../../../common/repository/types";
import { NON_CANCELLABLE_BSDASRI_STATUSES } from "../../resolvers/mutations/revisionRequest/createRevisionRequest";
import { ForbiddenError } from "../../../common/errors";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { operationHook } from "../../operationHook";
import { isFinalOperationCode } from "../../../common/operationCodes";
import type { BsdasriPackaging } from "@td/codegen-back";
import { computeTotalVolume } from "../../converter";

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
  approval: BsdasriRevisionRequestApproval & {
    revisionRequest: BsdasriRevisionRequest;
  }
) {
  const bsdasri = await prisma.bsdasri.findUniqueOrThrow({
    where: { id: approval.revisionRequest.bsdasriId }
  });

  if (bsdasri.emitterCompanySiret && bsdasri.ecoOrganismeSiret) {
    // Il y a à la fois un émetteur et un éco-organisme

    let otherApproval: BsdasriRevisionRequestApproval | null = null;

    if (approval.approverSiret === bsdasri.emitterCompanySiret) {
      // L'émetteur approuve, il faut également approuver pour
      // l'éco-organisme
      otherApproval = await prisma.bsdasriRevisionRequestApproval.findFirst({
        where: {
          revisionRequestId: approval.revisionRequestId,
          approverSiret: bsdasri.ecoOrganismeSiret
        }
      });
    }

    if (approval.approverSiret === bsdasri.ecoOrganismeSiret) {
      // L'éco-organisme approuve, il faut également approuver pour
      // l'émetteur
      otherApproval = await prisma.bsdasriRevisionRequestApproval.findFirst({
        where: {
          revisionRequestId: approval.revisionRequestId,
          approverSiret: bsdasri.emitterCompanySiret
        }
      });
    }

    if (otherApproval) {
      await prisma.bsdasriRevisionRequestApproval.update({
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
          type: "BsdasriRevisionRequestAccepted",
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

    const updatedApproval = await prisma.bsdasriRevisionRequestApproval.update({
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
        type: "BsdasriRevisionRequestAccepted",
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
    // - apply the revision to the Bsdasri
    const remainingApprovals =
      await prisma.bsdasriRevisionRequestApproval.count({
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

const getTotalVolume = bsdasriUpdate => {
  if (bsdasriUpdate.destinationWastePackagings) {
    return computeTotalVolume(
      bsdasriUpdate.destinationWastePackagings as BsdasriPackaging[]
    );
  }
  return null;
};

async function getUpdateFromRevisionRequest(
  revisionRequest: BsdasriRevisionRequest,
  prisma: PrismaTransaction
) {
  const { status: currentStatus } = await prisma.bsdasri.findUniqueOrThrow({
    where: { id: revisionRequest.bsdasriId },
    select: { status: true }
  });
  const newStatus = getNewStatus(currentStatus, revisionRequest.isCanceled);

  const result = removeEmpty({
    wasteCode: revisionRequest.wasteCode,
    destinationWastePackagings: revisionRequest.destinationWastePackagings,
    destinationReceptionWasteWeightValue:
      revisionRequest.destinationReceptionWasteWeightValue,
    destinationOperationCode: revisionRequest.destinationOperationCode,
    destinationOperationMode: revisionRequest.destinationOperationMode,
    emitterPickupSiteName: revisionRequest.emitterPickupSiteName,
    emitterPickupSiteAddress: revisionRequest.emitterPickupSiteAddress,
    emitterPickupSiteCity: revisionRequest.emitterPickupSiteCity,
    emitterPickupSitePostalCode: revisionRequest.emitterPickupSitePostalCode,
    emitterPickupSiteInfos: revisionRequest.emitterPickupSiteInfos,

    destinationReceptionWasteVolume: getTotalVolume(revisionRequest),

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
  status: BsdasriStatus,
  // newOperationCode: string | null,
  isCanceled = false
): BsdasriStatus {
  if (isCanceled) {
    if (NON_CANCELLABLE_BSDASRI_STATUSES.includes(status)) {
      throw new ForbiddenError(
        "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
      );
    }

    return BsdasriStatus.CANCELED;
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
): Promise<BsdasriRevisionRequest> {
  const { prisma, user, logMetadata } = context;

  const updatedRevisionRequest = await prisma.bsdasriRevisionRequest.update({
    where: { id: revisionRequestId },
    data: { status: RevisionRequestStatus.ACCEPTED }
  });

  const bsdasriBeforeRevision = await prisma.bsdasri.findUniqueOrThrow({
    where: { id: updatedRevisionRequest.bsdasriId }
  });
  const updateData = await getUpdateFromRevisionRequest(
    updatedRevisionRequest,
    prisma
  );

  if (!updateData) {
    throw new Error(
      `Empty BSDASRI revision cannot be applied. Id #${updatedRevisionRequest.id}, BSDASRI id #${updatedRevisionRequest.bsdasriId}`
    );
  }

  const updatedBsdasri = await prisma.bsdasri.update({
    where: { id: updatedRevisionRequest.bsdasriId },
    data: { ...updateData }
  });

  if (updateData?.destinationOperationCode) {
    const beforeRevisionOperationIsFinal = isFinalOperationCode(
      bsdasriBeforeRevision.destinationOperationCode
    );
    const updatedOperationIsFinal = isFinalOperationCode(
      updateData.destinationOperationCode
    );
    if (updatedOperationIsFinal && !beforeRevisionOperationIsFinal) {
      prisma.addAfterCommitCallback?.(async () => {
        await operationHook(updatedBsdasri, { runSync: false });
      });
    } else if (!updatedOperationIsFinal && beforeRevisionOperationIsFinal) {
      await prisma.bsdasriFinalOperation.deleteMany({
        where: { finalBsdasriId: updatedBsdasri.id }
      });
    }
  }

  await prisma.event.create({
    data: {
      streamId: updatedRevisionRequest.bsdasriId,
      actor: user.id,
      type: "BsdasriRevisionRequestApplied",
      data: {
        content: updateData,
        revisionRequestId: updatedRevisionRequest.id
      },
      metadata: { ...logMetadata, authType: user.auth }
    }
  });

  if (updateData.status === BsdasriStatus.CANCELED) {
    // If the bsdasri was a grouping or synthesis bsdasri, and is cancelled, free the children and update denormalized fields

    await prisma.bsdasri.updateMany({
      where: {
        OR: [
          { groupedInId: updatedBsdasri.id },
          { synthesizedInId: updatedBsdasri.id }
        ]
      },
      data: {
        groupedInId: null,
        synthesizedInId: null
      }
    });

    await prisma.bsdasri.update({
      where: { id: updatedRevisionRequest.bsdasriId },
      data: {
        groupingEmitterSirets: [],
        synthesisEmitterSirets: []
      }
    });
  }

  prisma.addAfterCommitCallback?.(() =>
    enqueueUpdatedBsdToIndex(updatedRevisionRequest.bsdasriId)
  );

  return updatedRevisionRequest;
}
