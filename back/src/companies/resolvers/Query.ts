import type { QueryResolvers } from "@td/codegen-back";
import companyInfos from "./queries/companyInfos";
import companyPrivateInfos from "./queries/companyPrivateInfos";
import searchCompanies from "./queries/searchCompanies";
import favorites from "./queries/favorites";
import ecoOrganismes from "./queries/ecoOrganismes";
import companiesForVerification from "./queries/companiesForVerification";
import companyExhaustive from "./queries/companyExhaustive";
import registryCompanies from "./queries/registryCompanies";
const Query: QueryResolvers = {
  companyInfos,
  companyPrivateInfos,
  searchCompanies,
  favorites,
  ecoOrganismes,
  companiesForVerification,
  companyExhaustive,
  registryCompanies
};

export default Query;
