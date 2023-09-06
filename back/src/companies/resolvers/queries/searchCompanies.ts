import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department, allowForeignCompanies },
  _context
) => {
  // FIXME add authentication
  return searchCompanies(clue, department, allowForeignCompanies!);
};

export default searchCompaniesResolver;
