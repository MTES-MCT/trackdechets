export const PARTIAL_OPERATIONS = ["R 13", "D 15"] as const;
export const OPERATIONS = ["R 5", "D 5", "D 9", ...PARTIAL_OPERATIONS] as const;
export const WORKER_CERTIFICATION_ORGANISM = [
  "AFNOR Certification",
  "GLOBAL CERTIFICATION",
  "QUALIBAT"
] as const;
