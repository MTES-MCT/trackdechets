import { Bsda, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";

export type UpdateBsdaFn = (
  where: Prisma.BsdaWhereUniqueInput,
  data: Prisma.XOR<Prisma.BsdaUpdateInput, Prisma.BsdaUncheckedUpdateInput>,
  logMetadata?: LogMetadata
) => Promise<Bsda>;

export function buildUpdateBsda(deps: RepositoryFnDeps): UpdateBsdaFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsda = await prisma.bsda.update({ where, data });

    await prisma.event.create({
      data: {
        streamId: bsda.id,
        actor: user.id,
        type: bsdaEventTypes.updated,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // Status updates are done only through signature
    if (data.status) {
      await prisma.event.create({
        data: {
          streamId: bsda.id,
          actor: user.id,
          type: bsdaEventTypes.signed,
          data: { status: data.status },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    }

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsda.id));

    return bsda;
  };
}
