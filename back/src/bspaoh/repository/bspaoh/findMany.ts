import { Bspaoh, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBspaohFn = (
  where: Prisma.BspaohWhereInput,
  options?: Omit<Prisma.BspaohFindManyArgs, "where">
) => Promise<Bspaoh[]>;

export function buildFindManyBspaoh({
  prisma
}: ReadRepositoryFnDeps): FindManyBspaohFn {
  return (where, options?) => {
    const input = { where, ...options };

    return prisma.bspaoh.findMany(input);
  };
}
