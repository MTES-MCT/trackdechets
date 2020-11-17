import { UserInputError } from "apollo-server-express";
import prisma from "src/prisma";
import {
  CompanyPublic,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getInstallation } from "../../database";
import { searchCompany } from "../../sirene";
/**
 * This function is used to return public company
 * information for a specific siret. It merge info
 * from Sirene database, S3ic database and TD without
 * exposing private TD info like securityCode, users, etc
 *
 * @param siret
 */
export async function getCompanyInfos(siret: string): Promise<CompanyPublic> {
  // retrieve cached info from SIRENE database
  const { __typename, ...sireneCompanyInfo } = await searchCompany(siret);

  // sireneCompanyInfo default to { siret: '', ...} if the siret is
  // not recognized. Handle this edge case by throwing a NOT_FOUND
  // exception
  if (!sireneCompanyInfo || !sireneCompanyInfo.siret) {
    throw new UserInputError("Ce siret n'existe pas", {
      invalidArgs: ["siret"]
    });
  }

  // retrieves trackdechets public CompanyInfo
  // it might be null if the company is not registered in TD
  const trackdechetsCompanyInfo = await prisma.company.findOne({
    where: { siret },
    select: {
      contactEmail: true,
      contactPhone: true,
      website: true,
      ecoOrganismeAgreements: true
    }
  });

  const isRegistered = !!trackdechetsCompanyInfo;

  const companyIcpeInfo = {
    installation: await getInstallation(siret)
  };

  const company = {
    isRegistered,
    ecoOrganismeAgreements: [],

    ...companyIcpeInfo,
    ...sireneCompanyInfo,
    ...trackdechetsCompanyInfo
  };

  return company;
}

const companyInfosResolvers: QueryResolvers["companyInfos"] = (
  parent,
  args
) => {
  return getCompanyInfos(args.siret);
};

export default companyInfosResolvers;
