import { AllBsdaSignatureType } from "../types";
import { ZodBsda } from "./schema";

export const PARTIAL_OPERATIONS = ["R 13", "D 15"] as const;
export const OPERATIONS = ["R 5", "D 5", "D 9", ...PARTIAL_OPERATIONS] as const;
export const WORKER_CERTIFICATION_ORGANISM = [
  "AFNOR Certification",
  "GLOBAL CERTIFICATION",
  "QUALIBAT"
] as const;

function transporterNSignatureDate(bsda: ZodBsda, n: number) {
  if (bsda.transporters && bsda.transporters.length > n - 1) {
    return bsda.transporters[n - 1].transporterTransportSignatureDate;
  }
  return null;
}

export const SIGNATURES_HIERARCHY: {
  [key in AllBsdaSignatureType]: {
    signatureDate: (bsda: ZodBsda) => Date | null | undefined;
    next?: AllBsdaSignatureType;
  };
} = {
  EMISSION: {
    signatureDate: bsda => bsda.emitterEmissionSignatureDate,
    next: "WORK"
  },
  WORK: {
    signatureDate: bsda => bsda.workerWorkSignatureDate,
    next: "TRANSPORT"
  },
  TRANSPORT: {
    signatureDate: bsda => transporterNSignatureDate(bsda, 1),
    next: "TRANSPORT_2"
  },
  TRANSPORT_2: {
    signatureDate: bsda => transporterNSignatureDate(bsda, 2),
    next: "TRANSPORT_3"
  },
  TRANSPORT_3: {
    signatureDate: bsda => transporterNSignatureDate(bsda, 3),
    next: "TRANSPORT_4"
  },
  TRANSPORT_4: {
    signatureDate: bsda => transporterNSignatureDate(bsda, 4),
    next: "TRANSPORT_5"
  },
  TRANSPORT_5: {
    signatureDate: bsda => transporterNSignatureDate(bsda, 5),
    next: "OPERATION"
  },
  OPERATION: { signatureDate: bsda => bsda.destinationOperationSignatureDate }
};
