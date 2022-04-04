import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department },
  context
) => {
  const companies = await searchCompanies(clue, department);
  return companies.map(async company => {
    return {
      ...company,
      installation: await context.dataloaders.installations.load(company.siret)
    };
  });
};

export default searchCompaniesResolver;
