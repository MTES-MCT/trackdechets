import { User, Company, prisma } from "../generated/prisma-client";
import { getCompanyAdminUsers } from "../companies/database";
import { NotCompanyAdmin, NotCompanyMember } from "../common/errors";

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
  const isCompanyMember = await prisma.$exists.companyAssociation({
    user: {
      id
    },
    company: {
      siret
    }
  });

  if (isCompanyMember) {
    return true;
  }

  throw new NotCompanyMember(siret);
}
