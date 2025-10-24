import { BsdasriRevisionRequest, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsdasriRevisionRequestFn = (
  where: Prisma.BsdasriRevisionRequestWhereInput,
  options?: Omit<Prisma.BsdasriRevisionRequestFindManyArgs, "where">
) => Promise<BsdasriRevisionRequest[]>;

export function buildFindManyBsdasriRevisionRequest({
  prisma
}: ReadRepositoryFnDeps): FindManyBsdasriRevisionRequestFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.bsdasriRevisionRequest.findMany(input);
  };
}
