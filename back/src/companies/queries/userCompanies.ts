import { prisma, Company } from "../../generated/prisma-client";
import { getCachedCompanySireneInfo } from "../insee";
import { getInstallation } from "./";

const companyFragment = `
fragment Company on CompanyAssociation {
  company {
    id
    siret
    securityCode
    gerepId
    contactEmail
    contactPhone
    website
    companyTypes
    givenName
  }
}
`;

/**
 * Returns the list of companies a user belongs to
 * Information from TD, Sirene, and s3ic are merged
 * to make up an instance of CompanyPrivate
 * @param userId
 */
export async function getUserCompanies(userId: string) {
  if (!userId) {
    return Promise.resolve([]);
  }

  const companies = await prisma
    .companyAssociations({ where: { user: { id: userId } } })
    .$fragment<{ company: Company }[]>(companyFragment)
    .then(associations => associations.map(a => a.company));

  return Promise.all(
    companies.map(async company => {
      const companySireneInfo = await getCachedCompanySireneInfo(company.siret);
      const companyIcpeInfo = {
        installation: await getInstallation(company.siret)
      };
      return { ...companyIcpeInfo, ...companySireneInfo, ...company };
    })
  );
}
