import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountRevisionRequestFn = (
  where: Prisma.BsdasriRevisionRequestWhereInput
) => Promise<number>;

export function buildCountRevisionRequests({
  prisma
}: ReadRepositoryFnDeps): CountRevisionRequestFn {
  return where => {
    return prisma.bsdasriRevisionRequest.count({ where });
  };
}
