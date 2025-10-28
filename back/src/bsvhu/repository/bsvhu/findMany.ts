import { Bsvhu, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsvhuFn = (
  where: Prisma.BsvhuWhereInput,
  options?: Omit<Prisma.BsvhuFindManyArgs, "where">
) => Promise<Bsvhu[]>;

export function buildFindManyBsvhu({
  prisma
}: ReadRepositoryFnDeps): FindManyBsvhuFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bsvhu.findMany(input);
  };
}
