import { BsdasriRevisionRequest, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type CancelRevisionRequestFn = (
  where: Prisma.BsdasriRevisionRequestWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<BsdasriRevisionRequest>;

export function buildCancelRevisionRequest(
  deps: RepositoryFnDeps
): CancelRevisionRequestFn {
  return async (where, logMetadata) => {
    const { prisma, user } = deps;

    await prisma.bsdasriRevisionRequestApproval.deleteMany({
      where: { revisionRequest: where }
    });
    const deletedRevisionRequest = await prisma.bsdasriRevisionRequest.delete({
      where
    });

    await prisma.event.create({
      data: {
        streamId: deletedRevisionRequest.id,
        actor: user.id,
        type: "BsdasriRevisionRequestCancelled",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(deletedRevisionRequest.bsdasriId)
    );

    return deletedRevisionRequest;
  };
}
