import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../search";
import { checkIsAuthenticated } from "../../../common/permissions";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department, allowForeignCompanies },
  context
) => {
  checkIsAuthenticated(context);
  return searchCompanies(clue, department, allowForeignCompanies!);
};

export default searchCompaniesResolver;
