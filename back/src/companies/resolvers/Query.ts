import { QueryResolvers } from "../../generated/graphql/types";
import companyInfos from "./queries/companyInfos";
import companyPrivateInfos from "./queries/companyPrivateInfos";
import searchCompanies from "./queries/searchCompanies";
import favorites from "./queries/favorites";
import ecoOrganismes from "./queries/ecoOrganismes";
import companiesForVerification from "./queries/companiesForVerification";
import anonymousCompanyRequests from "./queries/anonymousCompanyRequests";

const Query: QueryResolvers = {
  companyInfos,
  companyPrivateInfos,
  searchCompanies,
  favorites,
  ecoOrganismes,
  companiesForVerification,
  anonymousCompanyRequests
};

export default Query;
