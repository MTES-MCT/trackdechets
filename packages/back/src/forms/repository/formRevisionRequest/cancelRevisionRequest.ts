import { BsddRevisionRequest, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../types";

export type CancelRevisionRequestFn = (
  where: Prisma.BsddRevisionRequestWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<BsddRevisionRequest>;

const buildCancelRevisionRequest: (
  deps: RepositoryFnDeps
) => CancelRevisionRequestFn =
  ({ prisma, user }) =>
  async (where, logMetadata) => {
    const deletedRevisionRequest = await prisma.bsddRevisionRequest.delete({
      where
    });

    await prisma.event.create({
      data: {
        streamId: deletedRevisionRequest.id,
        actor: user.id,
        type: "BsddRevisionRequestCancelled",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });
    return deletedRevisionRequest;
  };

export default buildCancelRevisionRequest;
