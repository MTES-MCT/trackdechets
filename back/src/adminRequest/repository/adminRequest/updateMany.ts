import { Prisma } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";

export type UpdateManyAdminRequestFn = (
  where: Prisma.AdminRequestWhereInput,
  data: Prisma.AdminRequestUpdateManyMutationInput
) => Promise<Prisma.BatchPayload>;

export const buildUpdateManyAdminRequest = (
  deps: RepositoryFnDeps
): UpdateManyAdminRequestFn => {
  return async (where, data) => {
    const { prisma } = deps;

    const adminRequests = await prisma.adminRequest.updateMany({
      where,
      data
    });

    return adminRequests;
  };
};
