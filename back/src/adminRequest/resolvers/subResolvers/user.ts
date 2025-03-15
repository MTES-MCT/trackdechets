import { prisma } from "@td/prisma";
import type { AdminRequest, AdminRequestResolvers } from "@td/codegen-back";

const getUser = async (adminRequest: AdminRequest) => {
  const user = await prisma.adminRequest
    .findUniqueOrThrow({
      where: { id: adminRequest.id }
    })
    .user();

  return user;
};

export const userResolver: AdminRequestResolvers["user"] = adminRequest =>
  getUser(adminRequest) as any;
