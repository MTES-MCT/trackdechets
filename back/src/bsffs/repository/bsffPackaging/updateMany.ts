import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";
import { checkPackagingGroupIntegrity } from "./checkPackagingGroupIntegrity";

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
    if (args.data.bsffId) {
      const packagings = await prisma.bsffPackaging.findMany({
        where: args.where,
        select: { id: true }
      });

      for (const packaging of packagings) {
        await checkPackagingGroupIntegrity(
          packaging.id,
          args.data.bsffId as string,
          prisma
        );
      }
    }
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
