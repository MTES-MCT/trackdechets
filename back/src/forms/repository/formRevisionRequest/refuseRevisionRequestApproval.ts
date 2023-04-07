import {
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

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
    await prisma.bsddRevisionRequest.update({
      where: { id: revisionRequestApproval.revisionRequestId },
      data: { status: RevisionRequestStatus.REFUSED }
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
  };

export default buildRefuseRevisionRequestApproval;
