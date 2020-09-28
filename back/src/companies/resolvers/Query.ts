import { QueryResolvers } from "../../generated/graphql/types";
import companyInfos from "./queries/companyInfos";
import searchCompanies from "./queries/searchCompanies";
import favorites from "./queries/favorites";
import ecoOrganismes from "./queries/ecoOrganismes";

const Query: QueryResolvers = {
  companyInfos,
  searchCompanies,
  favorites,
  ecoOrganismes
};

export default Query;
