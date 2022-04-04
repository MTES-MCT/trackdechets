import { BsddRevisionRequest, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../types";

export type CreateRevisionRequestFn = (
  data: Prisma.BsddRevisionRequestCreateInput,
  logMetadata?: LogMetadata
) => Promise<BsddRevisionRequest>;

const buildCreateRevisionRequest: (
  deps: RepositoryFnDeps
) => CreateRevisionRequestFn =
  ({ prisma, user }) =>
  async (data, logMetadata) => {
    const createdRevisionRequest = await prisma.bsddRevisionRequest.create({
      data
    });

    await prisma.event.create({
      data: {
        streamId: createdRevisionRequest.id,
        actor: user.id,
        type: "BsddRevisionRequestCreated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });
    return createdRevisionRequest;
  };

export default buildCreateRevisionRequest;
