import { Bsda, Prisma } from "@prisma/client";
import { deleteBsd } from "../../../common/elastic";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";
import { GraphQLContext } from "../../../types";

export type DeleteBsdaFn = (
  where: Prisma.BsdaWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<Bsda>;

export function buildDeleteBsda(deps: RepositoryFnDeps): DeleteBsdaFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;

    const deletedBsda = await prisma.bsda.update({
      where,
      data: { isDeleted: true }
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

    await deleteBsd(deletedBsda, { user } as GraphQLContext);

    return deletedBsda;
  };
}
