import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department }
) => searchCompanies(clue, department);

export default searchCompaniesResolver;
