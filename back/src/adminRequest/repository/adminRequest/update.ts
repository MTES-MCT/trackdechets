import { Prisma, AdminRequest } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type UpdateAdminRequestFn = (
  where: Prisma.AdminRequestWhereUniqueInput,
  data: Prisma.AdminRequestUpdateInput,
  logMetadata?: LogMetadata
) => Promise<AdminRequest>;

export const buildUpdateAdminRequest = (
  deps: RepositoryFnDeps
): UpdateAdminRequestFn => {
  return async (where, data, logMetadata) => {
    const { prisma, user } = deps;

    const delegation = await prisma.adminRequest.update({
      where,
      data
    });

    await prisma.event.create({
      data: {
        streamId: delegation.id,
        actor: user.id,
        type: "AdminRequestUpdated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return delegation;
  };
};
