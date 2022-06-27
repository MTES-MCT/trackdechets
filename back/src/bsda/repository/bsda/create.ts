import { Bsda, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";
import { GraphQLContext } from "../../../types";
import { indexBsda } from "../../elastic";

export type CreateBsdaFn = (
  data: Prisma.BsdaCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsda>;

export function buildCreateBsda(deps: RepositoryFnDeps): CreateBsdaFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsda = await prisma.bsda.create({ data });

    await prisma.event.create({
      data: {
        streamId: bsda.id,
        actor: user.id,
        type: "BsdaCreated",
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    await indexBsda(bsda, { user } as GraphQLContext);

    return bsda;
  };
}
