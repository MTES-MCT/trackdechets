import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountMfaResetRequestsFn = (
  where: Prisma.MfaResetRequestWhereInput
) => Promise<number>;

export function buildCountMfaResetRequests({
  prisma
}: ReadRepositoryFnDeps): CountMfaResetRequestsFn {
  return (where) => prisma.mfaResetRequest.count({ where });
}
