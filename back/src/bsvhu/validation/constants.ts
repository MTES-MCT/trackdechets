import { ZodBsvhu } from "./schema";
import { AllBsvhuSignatureType } from "../types";

function transporterNHasSigned(bsvhu: ZodBsvhu, n: number) {
  if (bsvhu.transporters && bsvhu.transporters.length > n - 1) {
    return !!bsvhu.transporters[n - 1].transporterTransportSignatureDate;
  }
  return false;
}

export const BSVHU_SIGNATURES_HIERARCHY: {
  [key in AllBsvhuSignatureType]: {
    isSigned: (bsvhu: ZodBsvhu) => boolean;
    next?: AllBsvhuSignatureType;
  };
} = {
  EMISSION: {
    isSigned: bsvhu => Boolean(bsvhu.emitterEmissionSignatureDate),
    next: "TRANSPORT"
  },
  TRANSPORT: {
    isSigned: bsvhu => transporterNHasSigned(bsvhu, 1),
    next: "TRANSPORT_2"
  },
  TRANSPORT_2: {
    isSigned: bsvhu => transporterNHasSigned(bsvhu, 2),
    next: "TRANSPORT_3"
  },
  TRANSPORT_3: {
    isSigned: bsvhu => transporterNHasSigned(bsvhu, 3),
    next: "TRANSPORT_4"
  },
  TRANSPORT_4: {
    isSigned: bsvhu => transporterNHasSigned(bsvhu, 4),
    next: "TRANSPORT_5"
  },
  TRANSPORT_5: {
    isSigned: bsvhu => transporterNHasSigned(bsvhu, 5),
    next: "RECEPTION"
  },
  RECEPTION: {
    isSigned: bsvhu => Boolean(bsvhu.destinationReceptionSignatureDate),
    next: "OPERATION"
  },
  OPERATION: {
    isSigned: bsvhu => Boolean(bsvhu.destinationOperationSignatureDate)
  }
};
