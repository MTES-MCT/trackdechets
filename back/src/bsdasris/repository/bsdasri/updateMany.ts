import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdasriEventTypes } from "./eventTypes";
import { lookupUtils } from "../../registryV2";

export type UpdateManyBsdasriFn = (
  where: Prisma.BsdasriWhereInput,
  data: Prisma.XOR<
    Prisma.BsdasriUpdateManyMutationInput,
    Prisma.BsdasriUncheckedUpdateManyInput
  >,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

export function buildUpdateManyBsdasris(
  deps: RepositoryFnDeps
): UpdateManyBsdasriFn {
  return async (where, data, logMetadata) => {
    const { prisma, user } = deps;

    const update = await prisma.bsdasri.updateMany({
      where,
      data
    });

    const updatedBsdasris = await prisma.bsdasri.findMany({
      where
      // select: { id: true }
    });

    const ids = updatedBsdasris.map(({ id }) => id);

    const eventsData = ids.map(id => ({
      streamId: id,
      actor: user.id,
      type: bsdasriEventTypes.updated,
      data: data as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }));

    await prisma.event.createMany({
      data: eventsData
    });
    for (const updatedBsdasri of updatedBsdasris) {
      await lookupUtils.update(updatedBsdasri, prisma);
      prisma.addAfterCommitCallback(() =>
        enqueueUpdatedBsdToIndex(updatedBsdasri.id)
      );
    }

    return update;
  };
}
