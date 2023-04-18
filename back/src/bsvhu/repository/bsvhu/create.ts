import { Bsvhu, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
export type CreateBsvhuFn = (
  data: Prisma.BsvhuCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsvhu>;

export function buildCreateBsvhu(deps: RepositoryFnDeps): CreateBsvhuFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsvhu = await prisma.bsvhu.create({ data });

    await prisma.event.create({
      data: {
        streamId: bsvhu.id,
        actor: user.id,
        type: bsvhuEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsvhu.id));

    return bsvhu;
  };
}
