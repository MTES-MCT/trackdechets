import type { FavoriteType } from "@td/codegen-back";

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

export const companyEventTypes = {
  toggleDormantCompany: "CompanyToggleDormantCompany",
  administrativeTransferCreated: "CompanyAdministrativeTransferCreated",
  administrativeTransferCancelled: "CompanyAdministrativeTransferCancelled",
  administrativeTransferApproval: "CompanyAdministrativeTransferApproval"
};
