import { Bsff, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import { objectDiff } from "../../../forms/workflow/diff";

export type UpdateBsffFn = (
  args: Prisma.BsffUpdateArgs,
  logMetadata?: LogMetadata
) => Promise<Bsff>;

export function buildUpdateBsff(deps: RepositoryFnDeps): UpdateBsffFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const previousBsff = await prisma.bsff.findUnique({ where: args.where });
    const bsff = await prisma.bsff.update(args);

    const updateDiff = objectDiff(previousBsff, bsff);
    await prisma.event.create({
      data: {
        streamId: bsff.id,
        actor: user.id,
        type: args.data?.status
          ? bsffEventTypes.signed
          : bsffEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsff.id));

    return bsff;
  };
}
