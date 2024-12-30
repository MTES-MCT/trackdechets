import { Bsvhu, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
import { lookupUtils } from "../../registryV2";
export type DeleteBsvhuFn = (
  where: Prisma.BsvhuWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<Bsvhu>;

export function buildDeleteBsvhu(deps: RepositoryFnDeps): DeleteBsvhuFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;
    const deletedBsvhu = await prisma.bsvhu.update({
      where,
      data: {
        isDeleted: true
      }
    });

    await prisma.event.create({
      data: {
        streamId: deletedBsvhu.id,
        actor: user.id,
        type: bsvhuEventTypes.deleted,
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    await lookupUtils.delete(deletedBsvhu.id, prisma);
    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBsvhu.id));

    return deletedBsvhu;
  };
}
