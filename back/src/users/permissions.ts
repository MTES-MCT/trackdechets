import { User, Company } from "../generated/prisma-client";
import { getCompanyAdminUsers } from "../companies/queries";
import { NotCompanyAdmin } from "../common/errors";

export async function checkIsAdmin(user: User, company: Company) {
  const admins = await getCompanyAdminUsers(company.siret);
  if (!admins.map(u => u.id).includes(user.id)) {
    throw new NotCompanyAdmin(company.siret);
  }
  return true;
}
