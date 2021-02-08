import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../sirene/";
import { getInstallation } from "../../database";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  parent,
  { clue, department }
) => {
  const companies = await searchCompanies(clue, department);
  return companies.map(async company => {
    return {
      ...company,
      installation: await getInstallation(company.siret)
    };
  });
};

export default searchCompaniesResolver;
