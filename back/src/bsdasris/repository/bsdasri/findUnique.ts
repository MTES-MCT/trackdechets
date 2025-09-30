import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBsdasriFn = (
  where: Prisma.BsdasriWhereUniqueInput,
  options?: Omit<Prisma.BsdasriFindUniqueArgs, "where">
) => Promise<any>;

export function buildFindUniqueBsdasri({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsdasriFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bsdasri.findUnique(input);
  };
}
