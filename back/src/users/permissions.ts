import { User, Company } from "@prisma/client";
import { getCompanyAdminUsers } from "../companies/database";
import { NotCompanyAdmin, NotCompanyMember } from "../common/errors";
import { getCachedUserCompanies } from "../common/redis/users";

export async function checkIsCompanyAdmin(user: User, company: Company) {
  const admins = await getCompanyAdminUsers(company.siret);
  if (!admins.map(u => u.id).includes(user.id)) {
    throw new NotCompanyAdmin(company.siret);
  }
  return true;
}

export async function checkIsCompanyMember(
  { id }: { id: string },
  { siret }: { siret: string }
) {
  const userCompaniesSiretOrVat = await getCachedUserCompanies(id);

  const isCompanyMember = userCompaniesSiretOrVat.includes(siret);

  if (isCompanyMember) {
    return true;
  }

  throw new NotCompanyMember(siret);
}
