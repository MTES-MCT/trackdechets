import { isForeignVat } from "../../../common/constants/companySearchHelpers";
import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../search";
import { checkIsAuthenticated } from "../../../common/permissions";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department, allowForeignCompanies },
  context
) => {
  checkIsAuthenticated(context);
  if (isForeignVat(clue) && !!allowForeignCompanies && !allowForeignCompanies) {
    return [];
  }
  return searchCompanies(clue, department).then(async results =>
    results.map(async company => ({
      ...company,
      ...(company.siret
        ? {
            installation: await context.dataloaders.installations.load(
              company.siret!
            )
          }
        : {})
    }))
  );
};

export default searchCompaniesResolver;
