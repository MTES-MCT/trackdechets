import { prisma, Company } from "../../generated/prisma-client";
import { searchCompany } from "../sirene";
import { getInstallation } from "./";

export async function getUserCompanies(userId: string) {
  const companyAssociations = await prisma
    .user({ id: userId })
    .companyAssociations();
  return Promise.all(
    companyAssociations.map(association => {
      return prisma.companyAssociation({ id: association.id }).company();
    })
  );
}

/**
 * Returns the list of companies a user belongs to
 * Information from TD, Sirene, and s3ic are merged
 * to make up an instance of CompanyPrivate
 * @param userId
 */
export async function getUserPrivateCompanies(
  userId: string
): Promise<Company[]> {
  if (!userId) {
    return Promise.resolve([]);
  }

  const companies = await getUserCompanies(userId);

  return Promise.all(
    companies.map(async company => {
      const companySireneInfo = await searchCompany(
        company.siret
      ).catch(_ => ({}));
      const companyIcpeInfo = {
        installation: await getInstallation(company.siret)
      };
      return { ...companyIcpeInfo, ...companySireneInfo, ...company };
    })
  );
}
