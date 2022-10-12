import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountBsvhusFn = (where: Prisma.BsvhuWhereInput) => Promise<number>;

export function buildCountBsvhus({
  prisma
}: ReadRepositoryFnDeps): CountBsvhusFn {
  return where => {
    return prisma.bsvhu.count({ where });
  };
}
