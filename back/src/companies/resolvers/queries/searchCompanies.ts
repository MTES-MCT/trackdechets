import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department, allowForeignCompanies },
  _context
) => searchCompanies(clue, department, allowForeignCompanies);

export default searchCompaniesResolver;
