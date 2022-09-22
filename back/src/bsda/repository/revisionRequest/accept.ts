import {
  BsdaRevisionRequest,
  BsdaStatus,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import {
  LogMetadata,
  PrismaTransaction,
  RepositoryFnDeps
} from "../../../forms/repository/types";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";
import { PARTIAL_OPERATIONS } from "../../validation";

export type AcceptRevisionRequestApprovalFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string },
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

    const revisionRequest = await approveAndApplyRevisionRequest(
      updatedApproval.revisionRequestId,
      {
        prisma,
        user,
        logMetadata
      }
    );

    prisma.addAfterCommitCallback(() =>
      enqueueBsdToIndex(revisionRequest.bsdaId)
    );
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
    ...bsdaUpdate
  } = revisionRequest;

  const { status: currentStatus } = await prisma.bsda.findUnique({
    where: { id: bsdaId },
    select: { status: true }
  });
  const newStatus = getNewStatus(
    currentStatus,
    bsdaUpdate.destinationOperationCode
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
  newOperationCode: string | null
): BsdaStatus {
  if (
    status === BsdaStatus.PROCESSED &&
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

function removeEmpty<T>(obj: T): Partial<T> {
  const cleanedObject = Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true)
    )
  );

  return Object.keys(cleanedObject).length === 0
    ? null
    : (cleanedObject as Partial<T>);
}

export async function approveAndApplyRevisionRequest(
  revisionRequestId: string,
  context: {
    prisma: PrismaTransaction;
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

  await prisma.bsda.update({
    where: { id: updatedRevisionRequest.bsdaId },
    data: updateData
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

  return updatedRevisionRequest;
}
