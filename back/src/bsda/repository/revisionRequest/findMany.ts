import { BsdaRevisionRequest, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsdaRevisionRequestFn = (
  where: Prisma.BsdaRevisionRequestWhereInput,
  options?: Omit<Prisma.BsdaRevisionRequestFindManyArgs, "where">
) => Promise<BsdaRevisionRequest[]>;

export function buildFindManyBsdaRevisionRequest({
  prisma
}: ReadRepositoryFnDeps): FindManyBsdaRevisionRequestFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bsdaRevisionRequest.findMany(input);
  };
}
