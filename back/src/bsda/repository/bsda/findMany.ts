import { Bsda, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../forms/repository/types";

export type FindManyBsdaFn = (
  where: Prisma.BsdaWhereInput,
  options?: Omit<Prisma.BsdaFindManyArgs, "where">
) => Promise<Bsda[]>;

export function buildFindManyBsda({
  prisma
}: ReadRepositoryFnDeps): FindManyBsdaFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bsda.findMany(input);
  };
}
