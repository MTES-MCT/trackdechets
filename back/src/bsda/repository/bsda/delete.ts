import { Bsda, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";

export type DeleteBsdaFn = (
  where: Prisma.BsdaWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<Bsda>;

export function buildDeleteBsda(deps: RepositoryFnDeps): DeleteBsdaFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;
    const deletedBsda = await prisma.bsda.update({
      where,
      data: { isDeleted: true, forwardingId: null }
    });

    await prisma.bsda.updateMany({
      where: { groupedInId: deletedBsda.id },
      data: {
        groupedInId: null
      }
    });

    await prisma.event.create({
      data: {
        streamId: deletedBsda.id,
        actor: user.id,
        type: "BsdaDeleted",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBsda.id));

    return deletedBsda;
  };
}
