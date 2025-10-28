import { BsdaRevisionRequest, Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type CancelRevisionRequestFn = (
  where: Prisma.BsdaRevisionRequestWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<BsdaRevisionRequest>;

export function buildCancelRevisionRequest(
  deps: RepositoryFnDeps
): CancelRevisionRequestFn {
  return async (where, logMetadata) => {
    const { prisma, user } = deps;

    await prisma.bsdaRevisionRequestApproval.deleteMany({
      where: { revisionRequest: where }
    });
    const deletedRevisionRequest = await prisma.bsdaRevisionRequest.delete({
      where
    });

    await prisma.event.create({
      data: {
        streamId: deletedRevisionRequest.id,
        actor: user.id,
        type: "BsdaRevisionRequestCancelled",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(deletedRevisionRequest.bsdaId)
    );

    return deletedRevisionRequest;
  };
}
