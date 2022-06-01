import { Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../../../forms/repository/types";

export type CountBsdasFn = (where: Prisma.BsdaWhereInput) => Promise<number>;

export function buildCountBsdas({ prisma }: RepositoryFnDeps): CountBsdasFn {
  return where => {
    return prisma.bsda.count({ where });
  };
}
