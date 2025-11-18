import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";

export type UpdateManyBsffPackagingsFn = (
  args: Prisma.BsffPackagingUpdateManyArgs,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

export function buildUpdateManyBsffPackagings(
  deps: RepositoryFnDeps
): UpdateManyBsffPackagingsFn {
  return async (args, logMetadata) => {
    const { prisma, user } = deps;

    const update = await prisma.bsffPackaging.updateMany(args);

    const updatedBsffPackagings = await prisma.bsffPackaging.findMany({
      where: args.where,
      select: { bsffId: true }
    });

    const bsffIds = [
      ...new Set(updatedBsffPackagings.map(({ bsffId }) => bsffId))
    ];

    const eventsData = bsffIds.map(id => ({
      streamId: id,
      actor: user.id,
      type: bsffEventTypes.updated,
      data: args.data as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }));

    await prisma.event.createMany({
      data: eventsData
    });

    return update;
  };
}
