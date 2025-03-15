import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyAdminRequestFn = <
  Args extends Omit<Prisma.AdminRequestFindManyArgs, "where">
>(
  where: Prisma.AdminRequestWhereInput,
  options?: Args
) => Promise<Array<Prisma.AdminRequestGetPayload<Args>>>;

export function buildFindManyAdminRequest({
  prisma
}: ReadRepositoryFnDeps): FindManyAdminRequestFn {
  return async <Args extends Omit<Prisma.AdminRequestFindManyArgs, "where">>(
    where: Prisma.AdminRequestWhereInput,
    options?: Args
  ) => {
    const input = { where, ...options };
    const adminRequests = await prisma.adminRequest.findMany(input);
    return adminRequests as Array<Prisma.AdminRequestGetPayload<Args>>;
  };
}
