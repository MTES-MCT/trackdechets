import { BsdaRevisionRequest, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";

export type CreateRevisionRequestFn = (
  data: Prisma.BsdaRevisionRequestCreateInput,
  logMetadata?: LogMetadata
) => Promise<BsdaRevisionRequest>;

export function buildCreateRevisionRequest(
  deps: RepositoryFnDeps
): CreateRevisionRequestFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const revisionRequest = await prisma.bsdaRevisionRequest.create({ data });

    await prisma.event.create({
      data: {
        streamId: revisionRequest.id,
        actor: user.id,
        type: "BsdaRevisionRequestCreated",
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return revisionRequest;
  };
}
