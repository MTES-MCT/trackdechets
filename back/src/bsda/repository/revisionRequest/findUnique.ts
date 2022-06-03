import { BsdaRevisionRequest, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../forms/repository/types";

export type FindUniqueRevisionRequestFn = (
  where: Prisma.BsdaRevisionRequestWhereUniqueInput,
  options?: Omit<Prisma.BsdaRevisionRequestFindUniqueArgs, "where">
) => Promise<BsdaRevisionRequest>;

export function buildFindUniqueRevisionRequest({
  prisma
}: ReadRepositoryFnDeps): FindUniqueRevisionRequestFn {
  return async (where, options) => {
    return prisma.bsdaRevisionRequest.findUnique({
      where,
      ...options
    });
  };
}
