// form statuses
export enum FormStatus {
  DRAFT = "DRAFT",
  SEALED = "SEALED",
  SENT = "SENT",
  NO_TRACEABILITY = "NO_TRACEABILITY",
  PROCESSED = "PROCESSED",
  RECEIVED = "RECEIVED",
  REFUSED = "REFUSED",
  TEMP_STORED = "TEMP_STORED",
  RESEALED = "RESEALED",
  RESENT = "RESENT"
}
// form acceptation statuses, provide required granularity to tell apart refused and partially refused wastes
export enum WasteAcceptationStatus {
  ACCEPTED = "ACCEPTED",
  REFUSED = "REFUSED",
  PARTIALLY_REFUSED = "PARTIALLY_REFUSED"
}
