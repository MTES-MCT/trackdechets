import { AllBsffSignatureType } from "./types";
import { ZodBsff } from "./schema";

function transporterNSignatureDate(bsff: ZodBsff, n: number) {
  if (bsff.transporters && bsff.transporters.length > n - 1) {
    return bsff.transporters[n - 1].transporterTransportSignatureDate;
  }
  return null;
}

export const BSFF_SIGNATURES_HIERARCHY: {
  [key in AllBsffSignatureType]: {
    isSigned: (bsff: ZodBsff) => boolean;
    next?: AllBsffSignatureType;
  };
} = {
  EMISSION: {
    isSigned: bsff => Boolean(bsff.emitterEmissionSignatureDate),
    next: "TRANSPORT"
  },
  TRANSPORT: {
    isSigned: bsff => Boolean(transporterNSignatureDate(bsff, 1)),
    next: "RECEPTION" // "TRANSPORT_2 as soon as multi-modal is implemented"
  },
  TRANSPORT_2: {
    isSigned: bsff => Boolean(transporterNSignatureDate(bsff, 2)),
    next: "TRANSPORT_3"
  },
  TRANSPORT_3: {
    isSigned: bsff => Boolean(transporterNSignatureDate(bsff, 3)),
    next: "TRANSPORT_4"
  },
  TRANSPORT_4: {
    isSigned: bsff => Boolean(transporterNSignatureDate(bsff, 4)),
    next: "TRANSPORT_5"
  },
  TRANSPORT_5: {
    isSigned: bsff => Boolean(transporterNSignatureDate(bsff, 5)),
    next: "RECEPTION"
  },
  RECEPTION: {
    isSigned: bsff => Boolean(bsff.destinationReceptionSignatureDate),
    next: "ACCEPTATION"
  },
  ACCEPTATION: {
    isSigned: bsff =>
      !!bsff.packagings &&
      bsff.packagings.length > 0 &&
      bsff.packagings.every(p => Boolean(p.acceptationSignatureDate))
  },
  OPERATION: {
    isSigned: bsff =>
      !!bsff.packagings &&
      bsff.packagings.length > 0 &&
      bsff.packagings.every(p => Boolean(p.operationSignatureDate))
  }
};
