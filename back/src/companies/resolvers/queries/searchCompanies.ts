import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department, allowForeignCompanies },
  context
) => {
  applyAuthStrategies(context, [
    AuthType.Session,
    // On autorise la recherche par API
    AuthType.Bearer
  ]);
  checkIsAuthenticated(context);
  return searchCompanies(clue, department, allowForeignCompanies);
};

export default searchCompaniesResolver;
