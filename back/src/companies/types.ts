import { FavoriteType } from "../generated/graphql/types";

export { CompanySearchResult } from "../generated/graphql/types";

/**
 * Company interface only with identifiers
 * used with Company types derivatives
 */
export interface CompanyBaseIdentifiers {
  siret: string;
  vatNumber?: string;
}

export const allFavoriteTypes: FavoriteType[] = [
  "BROKER",
  "DESTINATION",
  "EMITTER",
  "NEXT_DESTINATION",
  "RECIPIENT",
  "TEMPORARY_STORAGE_DETAIL",
  "TRADER",
  "TRANSPORTER",
  "WORKER"
];
