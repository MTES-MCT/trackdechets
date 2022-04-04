import { BsdasriSignatureType } from "@trackdechets/codegen/src/front.gen";
export enum ExtraSignatureType {
  DirectTakeover = "DIRECT_TAKEOVER",
  SynthesisTakeOver = "SYNTHESIS_TAKEOVER"
}
export type SignatureType = BsdasriSignatureType | ExtraSignatureType;
