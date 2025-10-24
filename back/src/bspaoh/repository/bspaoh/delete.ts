import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";
import { bspaohEventTypes } from "./eventTypes";
import { PrismaBspaohWithTransporters } from "../../types";

export type DeleteBspaohFn = (
  where: Prisma.BspaohWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<PrismaBspaohWithTransporters>;

export function buildDeleteBspaoh(deps: RepositoryFnDeps): DeleteBspaohFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;
    const deletedBspaoh = await prisma.bspaoh.update({
      where,
      data: {
        isDeleted: true
      },
      include: { transporters: true }
    });

    await prisma.event.create({
      data: {
        streamId: deletedBspaoh.id,
        actor: user.id,
        type: bspaohEventTypes.deleted,
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });
    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBspaoh.id));

    return deletedBspaoh;
  };
}
