import { Bsvhu, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";

export type UpdateBsvhuFn = (
  where: Prisma.BsvhuWhereUniqueInput,
  data: Prisma.XOR<Prisma.BsvhuUpdateInput, Prisma.BsvhuUncheckedUpdateInput>,
  logMetadata?: LogMetadata
) => Promise<Bsvhu>;

export function buildUpdateBsvhu(deps: RepositoryFnDeps): UpdateBsvhuFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsvhu = await prisma.bsvhu.update({ where, data });

    await prisma.event.create({
      data: {
        streamId: bsvhu.id,
        actor: user.id,
        type: bsvhuEventTypes.updated,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // Status updates are done only through signature
    if (data.status) {
      await prisma.event.create({
        data: {
          streamId: bsvhu.id,
          actor: user.id,
          type: bsvhuEventTypes.signed,
          data: { status: data.status },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    }

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsvhu.id));

    return bsvhu;
  };
}
