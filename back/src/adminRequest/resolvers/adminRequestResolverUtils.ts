import { AdminRequest as PrismaAdminRequest, Company } from "@prisma/client";
import { AdminRequest } from "@td/codegen-back";

interface AdminRequestWithCompany extends PrismaAdminRequest {
  company: Company;
}

export const toGQLAdminRequest = (
  adminRequest: AdminRequestWithCompany
): AdminRequest => {
  return {
    id: adminRequest.id,
    companyOrgId: adminRequest.company.orgId,
    companyName: adminRequest.company.name,
    createdAt: adminRequest.createdAt,
    status: adminRequest.status
  };
};
