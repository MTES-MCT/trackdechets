import type { SignatureTypeInput } from "@td/codegen-back";
import { ZodBsdasri } from "./schema";

export const BSDASRI_SIGNATURES_HIERARCHY: {
  [key in SignatureTypeInput]: {
    isSigned: (bsdasri: ZodBsdasri) => boolean;
    next?: SignatureTypeInput;
  };
} = {
  EMISSION: {
    isSigned: bsdasri => Boolean(bsdasri.emitterEmissionSignatureDate),
    next: "TRANSPORT"
  },
  TRANSPORT: {
    isSigned: bsdasri => Boolean(bsdasri.transporterTransportSignatureDate),
    next: "RECEPTION"
  },
  RECEPTION: {
    isSigned: bsdasri => {
      return Boolean(bsdasri.destinationReceptionSignatureDate);
    },
    next: "OPERATION"
  },
  OPERATION: {
    isSigned: bsdasri => Boolean(bsdasri.destinationOperationSignatureDate)
  }
};
