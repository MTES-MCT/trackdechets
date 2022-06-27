import { Bsda, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../forms/repository/types";

export type FindUniqueBsdaFn = (
  where: Prisma.BsdaWhereUniqueInput,
  options?: Omit<Prisma.BsdaFindUniqueArgs, "where">
) => Promise<Bsda>;

export function buildFindUniqueBsda({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsdaFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bsda.findUnique(input);
  };
}
