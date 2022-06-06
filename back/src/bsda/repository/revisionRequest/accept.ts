import {
  BsdaRevisionRequest,
  Prisma,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";
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

    const revisionRequest = await prisma.bsdaRevisionRequest.findUnique({
      where: { id: updatedApproval.revisionRequestId }
    });
    await prisma.bsdaRevisionRequest.update({
      where: { id: revisionRequest.id },
      data: { status: RevisionRequestStatus.ACCEPTED }
    });

    const updateData = getUpdateFromRevisionRequest(revisionRequest);
    await prisma.bsda.update({
      where: { id: revisionRequest.bsdaId },
      data: updateData
    });

    await prisma.event.create({
      data: {
        streamId: revisionRequest.bsdaId,
        actor: user.id,
        type: "BsdaRevisionRequestApplied",
        data: {
          content: updateData,
          revisionRequestId: revisionRequest.id
        } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

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
      Object.entries(obj).filter(([_, v]) => v != null)
    );

    return Object.keys(cleanedObject).length === 0 ? null : cleanedObject;
  }

  return removeEmpty(bsdaUpdate);
}
