import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountAdminRequestsFn = (
  where: Prisma.AdminRequestWhereInput
) => Promise<number>;

export function buildCountAdminRequests({
  prisma
}: ReadRepositoryFnDeps): CountAdminRequestsFn {
  return where => {
    return prisma.adminRequest.count({ where });
  };
}
