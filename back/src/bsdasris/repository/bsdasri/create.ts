import { Bsdasri, Prisma, BsdasriType } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdasriEventTypes } from "./eventTypes";

export type CreateBsdasriFn = (
  data: Prisma.BsdasriCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsdasri>;

export function buildCreateBsdasri(deps: RepositoryFnDeps): CreateBsdasriFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsdasri = await prisma.bsdasri.create({
      data,
      include: { synthesizing: true }
    });

    if (bsdasri.type === BsdasriType.SYNTHESIS) {
      const synthesisEmitterSirets = [
        ...new Set(
          bsdasri.synthesizing.map(associated => associated.emitterCompanySiret)
        )
      ].filter(Boolean);

      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: { synthesisEmitterSirets }
      });
    }

    await prisma.event.create({
      data: {
        streamId: bsdasri.id,
        actor: user.id,
        type: bsdasriEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsdasri.id));

    return bsdasri;
  };
}
