import { Prisma } from "@prisma/client";
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

    const updatedBsdas = await prisma.bsda.findMany({
      where,
      select: { id: true }
    });
    const ids = updatedBsdas.map(({ id }) => id);

    const update = await prisma.bsda.updateMany({
      where,
      data
    });

    for (const id of ids) {
      await prisma.event.create({
        data: {
          streamId: id,
          actor: user.id,
          type: bsdaEventTypes.updated,
          data: data as Prisma.InputJsonObject,
          metadata: { ...logMetadata, authType: user.auth }
        }
      });

      prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(id));
    }

    return update;
  };
}
