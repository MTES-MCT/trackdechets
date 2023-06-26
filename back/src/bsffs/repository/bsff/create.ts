import { Bsff, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";

export type CreateBsffFn = (
  args: Prisma.BsffCreateArgs,
  logMetadata?: LogMetadata
) => Promise<Bsff>;

export function buildCreateBsff(deps: RepositoryFnDeps): CreateBsffFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const bsff = await prisma.bsff.create(args);

    await prisma.event.create({
      data: {
        streamId: bsff.id,
        actor: user.id,
        type: bsffEventTypes.created,
        data: args.data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsff.id));

    return bsff;
  };
}
