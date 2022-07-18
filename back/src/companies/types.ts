export { CompanySearchResult } from "../generated/graphql/types";

/**
 * Company interface only with identifiers
 * used with Company types derivatives
 */
export interface CompanyBaseIdentifiers {
  siret: string;
  vatNumber?: string;
}
