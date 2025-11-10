import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountBspaohsFn = (
  where: Prisma.BspaohWhereInput
) => Promise<number>;

export function buildCountBspaohs({
  prisma
}: ReadRepositoryFnDeps): CountBspaohsFn {
  return where => {
    return prisma.bspaoh.count({ where });
  };
}
