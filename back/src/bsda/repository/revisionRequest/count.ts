import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountRevisionRequestFn = (
  where: Prisma.BsdaRevisionRequestWhereInput
) => Promise<number>;

export function buildCountRevisionRequests({
  prisma
}: ReadRepositoryFnDeps): CountRevisionRequestFn {
  return where => {
    return prisma.bsdaRevisionRequest.count({ where });
  };
}
