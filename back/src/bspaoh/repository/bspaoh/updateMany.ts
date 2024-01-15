import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bspaohEventTypes } from "./eventTypes";

export type UpdateManyBspaohFn = (
  where: Prisma.BspaohWhereInput,
  data: Prisma.XOR<
    Prisma.BspaohUpdateManyMutationInput,
    Prisma.BspaohUncheckedUpdateManyInput
  >,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

export function buildUpdateManyBspaohs(
  deps: RepositoryFnDeps
): UpdateManyBspaohFn {
  return async (where, data, logMetadata) => {
    const { prisma, user } = deps;

    const update = await prisma.bspaoh.updateMany({
      where,
      data
    });

    const updatedBspaohs = await prisma.bspaoh.findMany({
      where,
      select: { id: true }
    });

    const ids = updatedBspaohs.map(({ id }) => id);

    const eventsData = ids.map(id => ({
      streamId: id,
      actor: user.id,
      type: bspaohEventTypes.updated,
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
