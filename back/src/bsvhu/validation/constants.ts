import type { SignatureTypeInput } from "@td/codegen-back";
import { ZodBsvhu } from "./schema";

export const BSVHU_SIGNATURES_HIERARCHY: {
  [key in SignatureTypeInput]: {
    isSigned: (bsvhu: ZodBsvhu) => boolean;
    next?: SignatureTypeInput;
  };
} = {
  EMISSION: {
    isSigned: bsvhu => Boolean(bsvhu.emitterEmissionSignatureDate),
    next: "TRANSPORT"
  },
  TRANSPORT: {
    isSigned: bsvhu => Boolean(bsvhu.transporterTransportSignatureDate),
    next: "OPERATION"
  },
  OPERATION: {
    isSigned: bsvhu => Boolean(bsvhu.destinationOperationSignatureDate)
  }
};
