import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import { lookupUtils } from "../../registryV2";

export type UpdateManyBsffFn = (
  args: Prisma.BsffUpdateManyArgs,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

export function buildUpdateManyBsff(deps: RepositoryFnDeps): UpdateManyBsffFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const batchPayload = await prisma.bsff.updateMany(args);

    const updatedBsffs = await prisma.bsff.findMany({
      where: args.where
      // select: { id: true }
    });

    const ids = updatedBsffs.map(({ id }) => id);

    const eventsData = ids.map(id => ({
      streamId: id,
      actor: user.id,
      type: bsffEventTypes.updated,
      data: args.data as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }));
    await prisma.event.createMany({
      data: eventsData
    });
    for (const updatedBsff of updatedBsffs) {
      await lookupUtils.update(updatedBsff, prisma);
      prisma.addAfterCommitCallback(() =>
        enqueueUpdatedBsdToIndex(updatedBsff.id)
      );
    }

    return batchPayload;
  };
}
