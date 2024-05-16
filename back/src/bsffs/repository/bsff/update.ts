import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import { objectDiff } from "../../../forms/workflow/diff";

export type UpdateBsffFn = <Args extends Prisma.BsffUpdateArgs>(
  args: Args,
  logMetadata?: LogMetadata
) => Promise<Prisma.BsffGetPayload<Args>>;

export function buildUpdateBsff(deps: RepositoryFnDeps): UpdateBsffFn {
  return async <Args extends Prisma.BsffUpdateArgs>(
    args: Args,
    logMetadata?: LogMetadata
  ) => {
    const { prisma, user } = deps;

    const previousBsff = await prisma.bsff.findUnique({ where: args.where });
    const bsff = await prisma.bsff.update(args);

    const { updatedAt, ...updateDiff } = objectDiff(previousBsff, bsff);
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

    return bsff as Prisma.BsffGetPayload<Args>;
  };
}
