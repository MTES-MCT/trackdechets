import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department, allowForeignCompanies },
  context
) => {
  checkIsAuthenticated(context);
  return searchCompanies(clue, department, allowForeignCompanies);
};

export default searchCompaniesResolver;
