import { Bsda, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";

export type CreateBsdaFn = (
  data: Prisma.BsdaCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsda>;

export function buildCreateBsda(deps: RepositoryFnDeps): CreateBsdaFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsda = await prisma.bsda.create({ data });

    await prisma.event.create({
      data: {
        streamId: bsda.id,
        actor: user.id,
        type: bsdaEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsda.id));

    return bsda;
  };
}
