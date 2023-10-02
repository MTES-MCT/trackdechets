import {
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type RefuseRevisionRequestFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string | null },
  logMetadata?: LogMetadata
) => Promise<void>;

const buildRefuseRevisionRequestApproval: (
  deps: RepositoryFnDeps
) => RefuseRevisionRequestFn =
  ({ prisma, user }) =>
  async (revisionRequestApprovalId, { comment }, logMetadata) => {
    const revisionRequestApproval =
      await prisma.bsddRevisionRequestApproval.update({
        where: { id: revisionRequestApprovalId },
        data: {
          status: RevisionRequestApprovalStatus.REFUSED,
          comment
        }
      });

    // We have a refusal:
    // - mark revision as refused
    // - mark every awaiting approval as skipped
    const revisionRequest = await prisma.bsddRevisionRequest.update({
      where: { id: revisionRequestApproval.revisionRequestId },
      data: { status: RevisionRequestStatus.REFUSED },
      include: { bsdd: { select: { readableId: true } } }
    });
    await prisma.bsddRevisionRequestApproval.updateMany({
      where: {
        revisionRequestId: revisionRequestApproval.id,
        status: RevisionRequestApprovalStatus.PENDING
      },
      data: { status: RevisionRequestApprovalStatus.CANCELED }
    });

    await prisma.event.create({
      data: {
        streamId: revisionRequestApproval.revisionRequestId,
        actor: user.id,
        type: "BsddRevisionRequestRefused",
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
      enqueueUpdatedBsdToIndex(revisionRequest.bsdd.readableId)
    );
  };

export default buildRefuseRevisionRequestApproval;
