import { User, Company } from "../generated/prisma-client";
import { getCompanyAdminUsers } from "../companies/database";
import { NotCompanyAdmin } from "../common/errors";

export async function checkIsCompanyAdmin(user: User, company: Company) {
  const admins = await getCompanyAdminUsers(company.siret);
  if (!admins.map(u => u.id).includes(user.id)) {
    throw new NotCompanyAdmin(company.siret);
  }
  return true;
}
