import {
  BsdaRevisionRequest,
  Prisma,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import {
  LogMetadata,
  PrismaTransaction,
  RepositoryFnDeps
} from "../../../forms/repository/types";
import { GraphQLContext } from "../../../types";
import { indexBsda } from "../../elastic";

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

    const updatedBsda = await prisma.bsda.findUnique({
      where: {
        id: revisionRequest.bsdaId
      }
    });
    await indexBsda(updatedBsda, { user } as GraphQLContext);
  };
}

function getUpdateFromRevisionRequest(revisionRequest: BsdaRevisionRequest) {
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

  function removeEmpty(obj) {
    const cleanedObject = Object.fromEntries(
      Object.entries(obj).filter(
        ([_, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true)
      )
    );

    return Object.keys(cleanedObject).length === 0 ? null : cleanedObject;
  }

  return removeEmpty(bsdaUpdate);
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

  const updateData = getUpdateFromRevisionRequest(updatedRevisionRequest);
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
      } as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }
  });

  return updatedRevisionRequest;
}
