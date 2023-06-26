import { Bsff, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";

export type UpdateBsffFn = (
  args: Prisma.BsffUpdateArgs,
  logMetadata?: LogMetadata
) => Promise<Bsff>;

export function buildUpdateBsff(deps: RepositoryFnDeps): UpdateBsffFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const bsff = await prisma.bsff.update(args);

    await prisma.event.create({
      data: {
        streamId: bsff.id,
        actor: user.id,
        type: bsffEventTypes.updated,
        data: args.data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // Status updates are done only through signature
    if (args.data?.status) {
      await prisma.event.create({
        data: {
          streamId: bsff.id,
          actor: user.id,
          type: bsffEventTypes.signed,
          data: { status: args.data.status },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    }

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsff.id));

    return bsff;
  };
}
