import { Bsdasri, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";
import { bsdasriEventTypes } from "./eventTypes";
import { lookupUtils } from "../../registryV2";

export type DeleteBsdasriFn = (
  where: Prisma.BsdasriWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<Bsdasri>;

export function buildDeleteBsdasri(deps: RepositoryFnDeps): DeleteBsdasriFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;
    const deletedBsdasri = await prisma.bsdasri.update({
      where,
      data: {
        isDeleted: true,
        grouping: { set: [] },
        synthesizing: { set: [] }
      }
    });

    await prisma.event.create({
      data: {
        streamId: deletedBsdasri.id,
        actor: user.id,
        type: bsdasriEventTypes.deleted,
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    await lookupUtils.delete(deletedBsdasri.id, prisma);
    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBsdasri.id));

    return deletedBsdasri;
  };
}
