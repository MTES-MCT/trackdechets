import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindFirstMfaResetRequestFn = <
  Args extends Omit<Prisma.MfaResetRequestFindFirstArgs, "where">
>(
  where: Prisma.MfaResetRequestWhereInput,
  options?: Args
) => Promise<Prisma.MfaResetRequestGetPayload<Args> | null>;

export function buildFindFirstMfaResetRequest({
  prisma
}: ReadRepositoryFnDeps): FindFirstMfaResetRequestFn {
  return async <Args extends Omit<Prisma.MfaResetRequestFindFirstArgs, "where">>(
    where: Prisma.MfaResetRequestWhereInput,
    options?: Args
  ) => {
    const input = { where, ...options };
    const result = await prisma.mfaResetRequest.findFirst(input);
    return result as Prisma.MfaResetRequestGetPayload<Args> | null;
  };
}
