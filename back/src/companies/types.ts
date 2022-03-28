import { CompanyType } from "../generated/graphql/types";

// return type for functions searchCompany and searchCompanies
export interface CompanySearchResult extends CompanyBaseIdentifiers {
  etatAdministratif?: string;
  address: string;
  codeCommune?: string;
  name: string;
  naf: string;
  libelleNaf: string;
  addressVoie: string;
  addressCity: string;
  addressPostalCode: string;
  isRegistered: boolean;
  ecoOrganismeAgreements?: URL[];
  companyTypes?: CompanyType[];
}
/**
 * Company interface only with identifiers
 * used with Company types derivatives
 */
export interface CompanyBaseIdentifiers {
  siret: string;
  vatNumber?: string;
}
