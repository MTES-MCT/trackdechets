import { CompanyType } from "../generated/graphql/types";

// return type for functions searchCompany and searchCompanies
export interface CompanySearchResult extends CompanyBaseIdentifiers {
  address: string;
  name: string;
  etatAdministratif?: string;
  codeCommune?: string;
  naf?: string;
  libelleNaf?: string;
  addressVoie?: string;
  addressCity?: string;
  addressPostalCode?: string;
  isRegistered: boolean;
  companyTypes: CompanyType[];
  ecoOrganismeAgreements?: URL[];
}
/**
 * Company interface only with identifiers
 * used with Company types derivatives
 */
export interface CompanyBaseIdentifiers {
  siret: string;
  vatNumber?: string;
}
