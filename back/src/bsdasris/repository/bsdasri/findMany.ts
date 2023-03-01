import { Bsdasri, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsdasriFn = (
  where: Prisma.BsdasriWhereInput,
  options?: Omit<Prisma.BsdasriFindManyArgs, "where">
) => Promise<Bsdasri[]>;

export function buildFindManyBsdasri({
  prisma
}: ReadRepositoryFnDeps): FindManyBsdasriFn {
  return (where, options?) => {
    const input = { where, ...options };

    return prisma.bsdasri.findMany(input);
  };
}
