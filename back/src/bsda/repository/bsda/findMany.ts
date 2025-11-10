import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsdaFn = <
  Args extends Omit<Prisma.BsdaFindManyArgs, "where">
>(
  where: Prisma.BsdaWhereInput,
  options?: Args
) => Promise<Array<Prisma.BsdaGetPayload<Args>>>;

export function buildFindManyBsda({
  prisma
}: ReadRepositoryFnDeps): FindManyBsdaFn {
  return async <Args extends Omit<Prisma.BsdaFindManyArgs, "where">>(
    where: Prisma.BsdaWhereInput,
    options?: Args
  ) => {
    const input = { where, ...options };
    const bsdas = await prisma.bsda.findMany(input);
    return bsdas as Array<Prisma.BsdaGetPayload<Args>>;
  };
}
