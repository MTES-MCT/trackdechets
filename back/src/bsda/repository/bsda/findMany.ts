import { Bsda, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsdaFn = <Args extends Prisma.BsdaArgs>(
  where: Prisma.BsdaWhereInput,
  options?: Args
) => Promise<Prisma.BsdaGetPayload<Args>[]>;

export function buildFindManyBsda({
  prisma
}: ReadRepositoryFnDeps): FindManyBsdaFn {
  return async <Args>(where, options?) => {
    const input = { where, ...options };
    const bsdas = await prisma.bsda.findMany(input);
    return bsdas as Prisma.BsdaGetPayload<Args>[];
  };
}
