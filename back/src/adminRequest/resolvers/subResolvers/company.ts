import { prisma } from "@td/prisma";
import type { AdminRequest, AdminRequestResolvers } from "@td/codegen-back";

const getCompany = async (adminRequest: AdminRequest) => {
  const company = await prisma.adminRequest
    .findUniqueOrThrow({
      where: { id: adminRequest.id }
    })
    .company();

  return company;
};

export const companyResolver: AdminRequestResolvers["company"] = adminRequest =>
  getCompany(adminRequest) as any;
