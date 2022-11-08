import { Bsdasri, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";
import { bsdasriEventTypes } from "./eventTypes";

export type CreateBsdasriFn = (
  data: Prisma.BsdasriCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsdasri>;

export function buildCreateBsdasri(deps: RepositoryFnDeps): CreateBsdasriFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsdasri = await prisma.bsdasri.create({ data });

    await prisma.event.create({
      data: {
        streamId: bsdasri.id,
        actor: user.id,
        type: bsdasriEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueBsdToIndex(bsdasri.id));

    return bsdasri;
  };
}
