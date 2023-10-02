import {
  BsdaRevisionRequest,
  BsdaStatus,
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
import { NON_CANCELLABLE_BSDA_STATUSES } from "../../resolvers/mutations/revisionRequest/createRevisionRequest";
import { ForbiddenError } from "../../../common/errors";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type AcceptRevisionRequestApprovalFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string | null },
  logMetadata?: LogMetadata
) => Promise<void>;

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
      }
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
  revisionRequest: BsdaRevisionRequest,
  prisma: PrismaTransaction
) {
  const {
    bsdaId,
    comment,
    updatedAt,
    authoringCompanyId,
    createdAt,
    id,
    status,
    isCanceled,
    ...bsdaUpdate
  } = revisionRequest;

  const { status: currentStatus } = await prisma.bsda.findUniqueOrThrow({
    where: { id: bsdaId },
    select: { status: true }
  });
  const newStatus = getNewStatus(
    currentStatus,
    bsdaUpdate.destinationOperationCode,
    isCanceled
  );

  return removeEmpty({
    ...bsdaUpdate,
    status: newStatus,
    brokerRecepisseValidityLimit:
      bsdaUpdate.brokerRecepisseValidityLimit?.toISOString()
  });
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
    data: { status: RevisionRequestStatus.ACCEPTED }
  });

  const updateData = await getUpdateFromRevisionRequest(
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

  prisma.addAfterCommitCallback?.(() =>
    enqueueUpdatedBsdToIndex(updatedRevisionRequest.bsdaId)
  );

  return updatedRevisionRequest;
}
