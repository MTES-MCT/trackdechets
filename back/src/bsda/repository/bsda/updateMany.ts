import { Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";

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
      where,
      select: { id: true }
    });
    const ids = updatedBsdas.map(({ id }) => id);

    for (const id of ids) {
      await prisma.event.create({
        data: {
          streamId: id,
          actor: user.id,
          type: "BsdaUpdated",
          data: data as Prisma.InputJsonObject,
          metadata: { ...logMetadata, authType: user.auth }
        }
      });

      prisma.addAfterCommitCallback(() => enqueueBsdToIndex(id));
    }

    return update;
  };
}
