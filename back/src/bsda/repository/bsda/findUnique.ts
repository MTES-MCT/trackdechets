import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBsdaFn = <
  Include extends Omit<Prisma.BsdaFindUniqueArgs, "where">
>(
  where: Prisma.BsdaWhereUniqueInput,
  options?: Include
) => Promise<Prisma.BsdaGetPayload<Include>>;

export function buildFindUniqueBsda({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsdaFn {
  return async <Include>(where, options?) => {
    const input = { where, ...options };
    const bsda = await prisma.bsda.findUnique(input);
    return bsda as Prisma.BsdaGetPayload<Include>;
  };
}
