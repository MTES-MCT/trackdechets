import { BsdaRevisionRequest, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueRevisionRequestFn = (
  where: Prisma.BsdaRevisionRequestWhereUniqueInput,
  options?: Omit<Prisma.BsdaRevisionRequestFindUniqueArgs, "where">
) => Promise<BsdaRevisionRequest | null>;

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
