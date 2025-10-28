import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";

export type UpdateManyBsdaFn = (
  where: Prisma.BsdaWhereInput,
  data: Prisma.XOR<
    Prisma.BsdaUpdateManyMutationInput,
    Prisma.BsdaUncheckedUpdateManyInput
  >,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

export function buildUpdateManyBsdas(deps: RepositoryFnDeps): UpdateManyBsdaFn {
  return async (where, data, logMetadata) => {
    const { prisma, user } = deps;

    const update = await prisma.bsda.updateMany({
      where,
      data
    });

    const updatedBsdas = await prisma.bsda.findMany({
      where
    });

    const ids = updatedBsdas.map(({ id }) => id);

    const eventsData = ids.map(id => ({
      streamId: id,
      actor: user.id,
      type: bsdaEventTypes.updated,
      data: data as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }));

    await prisma.event.createMany({
      data: eventsData
    });
    for (const updatedBsda of updatedBsdas) {
      prisma.addAfterCommitCallback(() =>
        enqueueUpdatedBsdToIndex(updatedBsda.id)
      );
    }

    return update;
  };
}
