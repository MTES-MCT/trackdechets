import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBspaohFn = (
  where: Prisma.BspaohWhereUniqueInput,
  options?: Omit<Prisma.BspaohFindUniqueArgs, "where">
) => Promise<any>;

export function buildFindUniqueBspaoh({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBspaohFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bspaoh.findUnique(input);
  };
}
