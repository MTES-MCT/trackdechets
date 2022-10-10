import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountBsdasFn = (where: Prisma.BsdaWhereInput) => Promise<number>;

export function buildCountBsdas({
  prisma
}: ReadRepositoryFnDeps): CountBsdasFn {
  return where => {
    return prisma.bsda.count({ where });
  };
}
