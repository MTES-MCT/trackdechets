import {
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type RefuseRevisionRequestApprovalFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string | null },
  logMetadata?: LogMetadata
) => Promise<void>;

export function buildRefuseRevisionRequestApproval(
  deps: RepositoryFnDeps
): RefuseRevisionRequestApprovalFn {
  return async (revisionRequestApprovalId, { comment }, logMetadata) => {
    const { prisma, user } = deps;
    const revisionRequestApproval =
      await prisma.bsdasriRevisionRequestApproval.update({
        where: { id: revisionRequestApprovalId },
        data: {
          status: RevisionRequestApprovalStatus.REFUSED,
          comment
        }
      });

    // We have a refusal:
    // - mark revision as refused
    // - mark every awaiting approval as skipped
    const revisionRequest = await prisma.bsdasriRevisionRequest.update({
      where: { id: revisionRequestApproval.revisionRequestId },
      data: { status: RevisionRequestStatus.REFUSED }
    });
    await prisma.bsdasriRevisionRequestApproval.updateMany({
      where: {
        revisionRequestId: revisionRequestApproval.revisionRequestId,
        status: RevisionRequestApprovalStatus.PENDING
      },
      data: { status: RevisionRequestApprovalStatus.CANCELED }
    });

    await prisma.event.create({
      data: {
        streamId: revisionRequestApproval.revisionRequestId,
        actor: user.id,
        type: "BsdasriRevisionRequestRefused",
        data: {
          content: {
            status: RevisionRequestApprovalStatus.REFUSED,
            comment
          }
        },
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(revisionRequest.bsdasriId)
    );
  };
}
