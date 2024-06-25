import { ZodBsffPackaging } from "./schema";
import { BsffPackagingSignatureType } from "./types";

export const BSFF_PACKAGING_SIGNATURES_HIERARCHY: {
  [key in BsffPackagingSignatureType]: {
    isSigned: (bsffPackaging: ZodBsffPackaging) => boolean;
    next?: BsffPackagingSignatureType;
  };
} = {
  ACCEPTATION: {
    isSigned: bsffPackaging => Boolean(bsffPackaging.acceptationSignatureDate),
    next: "OPERATION"
  },
  OPERATION: {
    isSigned: bsffPackaging => Boolean(bsffPackaging.operationSignatureDate)
  }
};
