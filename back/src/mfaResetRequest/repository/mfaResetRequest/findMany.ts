import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyMfaResetRequestFn = <
  Args extends Omit<Prisma.MfaResetRequestFindManyArgs, "where">
>(
  where: Prisma.MfaResetRequestWhereInput,
  options?: Args
) => Promise<Array<Prisma.MfaResetRequestGetPayload<Args>>>;

export function buildFindManyMfaResetRequest({
  prisma
}: ReadRepositoryFnDeps): FindManyMfaResetRequestFn {
  return async <Args extends Omit<Prisma.MfaResetRequestFindManyArgs, "where">>(
    where: Prisma.MfaResetRequestWhereInput,
    options?: Args
  ) => {
    const input = { where, ...options };
    const results = await prisma.mfaResetRequest.findMany(input);
    return results as Array<Prisma.MfaResetRequestGetPayload<Args>>;
  };
}
