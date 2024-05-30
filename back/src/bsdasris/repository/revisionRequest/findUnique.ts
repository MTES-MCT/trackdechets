import { BsdasriRevisionRequest, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueRevisionRequestFn = (
  where: Prisma.BsdasriRevisionRequestWhereUniqueInput,
  options?: Omit<Prisma.BsdasriRevisionRequestFindUniqueArgs, "where">
) => Promise<BsdasriRevisionRequest | null>;

export function buildFindUniqueRevisionRequest({
  prisma
}: ReadRepositoryFnDeps): FindUniqueRevisionRequestFn {
  return async (where, options) => {
    return prisma.bsdasriRevisionRequest.findUnique({
      where,
      ...options
    });
  };
}
