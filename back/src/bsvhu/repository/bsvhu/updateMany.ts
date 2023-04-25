import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";

export type UpdateManyBsvhuFn = (
  where: Prisma.BsvhuWhereInput,
  data: Prisma.XOR<
    Prisma.BsvhuUpdateManyMutationInput,
    Prisma.BsvhuUncheckedUpdateManyInput
  >,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

export function buildUpdateManyBsvhus(
  deps: RepositoryFnDeps
): UpdateManyBsvhuFn {
  return async (where, data, logMetadata) => {
    const { prisma, user } = deps;

    const update = await prisma.bsvhu.updateMany({
      where,
      data
    });

    const updatedBsvhus = await prisma.bsvhu.findMany({
      where,
      select: { id: true }
    });

    const ids = updatedBsvhus.map(({ id }) => id);

    const eventsData = ids.map(id => ({
      streamId: id,
      actor: user.id,
      type: bsvhuEventTypes.updated,
      data: data as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }));

    await prisma.event.createMany({
      data: eventsData
    });
    for (const id of ids) {
      prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(id));
    }

    return update;
  };
}
