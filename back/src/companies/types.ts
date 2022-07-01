import { CompanyType } from "../generated/graphql/types";

// return type for functions searchCompany and searchCompanies
export interface CompanySearchResult extends CompanyBaseIdentifiers {
  address: string;
  name: string;
  // Ouvert "A", Fermé "F" (INSEE)
  etatAdministratif?: string;
  codeCommune?: string;
  naf?: string;
  libelleNaf?: string;
  addressVoie?: string;
  addressCity?: string;
  addressPostalCode?: string;
  // Enregistré sur TD
  isRegistered: boolean;
  companyTypes: CompanyType[];
  ecoOrganismeAgreements?: URL[];
  contactEmail: string;
  contactPhone: string;
  // diffusible ou non-diffusible légalement (INSEE)
  statutDiffusionEtablissement: "O" | "N";
  codePaysEtrangerEtablissement?: string;
}
/**
 * Company interface only with identifiers
 * used with Company types derivatives
 */
export interface CompanyBaseIdentifiers {
  siret: string;
  vatNumber?: string;
}
