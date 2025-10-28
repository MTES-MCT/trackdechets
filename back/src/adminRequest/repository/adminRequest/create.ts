import { Prisma, AdminRequest } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type CreateAdminRequestFn = (
  data: Prisma.AdminRequestCreateInput,
  logMetadata?: LogMetadata
) => Promise<AdminRequest>;

export const buildCreateAdminRequest = (
  deps: RepositoryFnDeps
): CreateAdminRequestFn => {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const adminRequest = await prisma.adminRequest.create({
      data
    });

    await prisma.event.create({
      data: {
        streamId: adminRequest.id,
        actor: user.id,
        type: "AdminRequestCreated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return adminRequest;
  };
};
