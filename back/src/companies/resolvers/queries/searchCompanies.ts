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
  if (isForeignVat(clue) && allowForeignCompanies === false) {
    return [];
  }
  return searchCompanies(clue, department, allowForeignCompanies!);
};

export default searchCompaniesResolver;
