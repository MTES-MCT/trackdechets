import { Bsdasri, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";

export type DeleteBsdasriFn = (
  where: Prisma.BsdaWhereUniqueInput,
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
        type: "BsdasriDeleted",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });
    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBsdasri.id));

    return deletedBsdasri;
  };
}
