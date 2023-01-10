import { BsffPackaging, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";

export type UpdateBsffPackagingFn = (
  args: Prisma.BsffPackagingUpdateArgs,
  logMetadata?: LogMetadata
) => Promise<BsffPackaging>;

export function buildUpdateBsffPackaging(
  deps: RepositoryFnDeps
): UpdateBsffPackagingFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const bsffPackaging = await prisma.bsffPackaging.update(args);

    await prisma.event.create({
      data: {
        streamId: bsffPackaging.bsffId,
        actor: user.id,
        type: bsffEventTypes.updated,
        data: args.data as Prisma.InputJsonObject,
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
