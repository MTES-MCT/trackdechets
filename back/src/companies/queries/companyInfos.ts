import { prisma, Company } from "../../generated/prisma-client";
import { getInstallation } from "./installation";
import { searchCompany } from "../sirene";
import { UserInputError } from "apollo-server-express";
/**
 * This function is used to return public company
 * information for a specific siret. It merge info
 * from Sirene database, S3ic database and TD without
 * exposing private TD info like securityCode, users, etc
 *
 * @param siret
 */
export async function getCompanyInfos(siret: string) {
  // retrieve cached info from SIRENE database
  const sireneCompanyInfo = await searchCompany(siret);

  // sireneCompanyInfo default to { siret: '', ...} if the siret is
  // not recognized. Handle this edge case by throwing a NOT_FOUND
  // exception
  if (!sireneCompanyInfo || !sireneCompanyInfo.siret) {
    throw new UserInputError("Ce siret n'existe pas", {
      invalidArgs: ["siret"]
    });
  }

  const companyFragment = `
    fragment PublicInfo on Company {
      contactEmail
      contactPhone
      website
    }
  `;

  type CompanyFragment = Pick<
    Company,
    "contactEmail" | "contactPhone" | "website"
  >;

  // retrieves trackdechets public CompanyInfo
  // it might be null if the company is not registered in TD
  const trackdechetsCompanyInfo = await prisma
    .company({ siret })
    .$fragment<CompanyFragment>(companyFragment);

  const isRegistered = !!trackdechetsCompanyInfo;

  const companyIcpeInfo = {
    installation: await getInstallation(siret)
  };

  const company = {
    ...companyIcpeInfo,
    ...sireneCompanyInfo,
    ...trackdechetsCompanyInfo,
    ...{ isRegistered }
  };

  return company;
}
