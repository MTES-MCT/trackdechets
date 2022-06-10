import { BsdaRevisionRequest, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";

export type CancelRevisionRequestFn = (
  where: Prisma.BsdaRevisionRequestWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<BsdaRevisionRequest>;

export function buildCancelRevisionRequest(
  deps: RepositoryFnDeps
): CancelRevisionRequestFn {
  return async (where, logMetadata) => {
    const { prisma, user } = deps;

    await prisma.bsddRevisionRequestApproval.deleteMany({
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
    return deletedRevisionRequest;
  };
}
