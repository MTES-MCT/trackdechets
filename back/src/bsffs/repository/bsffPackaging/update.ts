import { BsffPackaging, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";
import { objectDiff } from "../../../forms/workflow/diff";

export type UpdateBsffPackagingFn = (
  args: Prisma.BsffPackagingUpdateArgs,
  logMetadata?: LogMetadata
) => Promise<BsffPackaging>;

export function buildUpdateBsffPackaging(
  deps: RepositoryFnDeps
): UpdateBsffPackagingFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const previousBsffPackaging = await prisma.bsffPackaging.findUnique({
      where: args.where
    });
    const bsffPackaging = await prisma.bsffPackaging.update(args);

    const updateDiff = objectDiff(previousBsffPackaging, bsffPackaging);
    await prisma.event.create({
      data: {
        streamId: bsffPackaging.bsffId,
        actor: user.id,
        type: bsffEventTypes.updated,
        data: updateDiff,
        metadata: {
          ...logMetadata,
          authType: user.auth,
          packagingId: bsffPackaging.id
        }
      }
    });

    return bsffPackaging;
  };
}
