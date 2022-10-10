import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountBsdasrisFn = (
  where: Prisma.BsdasriWhereInput
) => Promise<number>;

export function buildCountBsdasris({
  prisma
}: ReadRepositoryFnDeps): CountBsdasrisFn {
  return where => {
    return prisma.bsdasri.count({ where });
  };
}
