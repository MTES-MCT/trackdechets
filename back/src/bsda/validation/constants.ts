import { Bsda } from "@prisma/client";
import { BsdaSignatureType } from "../../generated/graphql/types";

export const PARTIAL_OPERATIONS = ["R 13", "D 15"] as const;
export const OPERATIONS = ["R 5", "D 5", "D 9", ...PARTIAL_OPERATIONS] as const;
export const WORKER_CERTIFICATION_ORGANISM = [
  "AFNOR Certification",
  "GLOBAL CERTIFICATION",
  "QUALIBAT"
] as const;
export const SIGNATURES_HIERARCHY: {
  [key in BsdaSignatureType]: { field: keyof Bsda; next?: BsdaSignatureType };
} = {
  EMISSION: { field: "emitterEmissionSignatureDate", next: "WORK" },
  WORK: { field: "workerWorkSignatureDate", next: "TRANSPORT" },
  TRANSPORT: {
    field: "transporterTransportSignatureDate",
    next: "OPERATION"
  },
  OPERATION: { field: "destinationOperationSignatureDate" }
};
