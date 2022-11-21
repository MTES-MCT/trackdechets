import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBsvhuFn = (
  where: Prisma.BsvhuWhereUniqueInput,
  options?: Omit<Prisma.BsvhuFindUniqueArgs, "where">
) => Promise<any>;

export function buildFindUniqueBsvhu({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsvhuFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bsvhu.findUnique(input);
  };
}
