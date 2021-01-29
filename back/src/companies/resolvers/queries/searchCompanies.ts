import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../sirene/";
import { getInstallation } from "../../database";
import prisma from "../../../prisma";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  parent,
  { clue, department }
) => {
  const companies = await searchCompanies(clue, department);
  return companies.map(async company => {
    // check if company is registred in Trackdéchets and retrieves company types
    const tdCompany = await prisma.company.findUnique({
      where: { siret: company.siret },
      select: {
        companyTypes: true
      }
    });

    return {
      ...company,
      isRegistered: !!tdCompany,
      companyTypes: tdCompany?.companyTypes,
      installation: await getInstallation(company.siret)
    };
  });
};

export default searchCompaniesResolver;
