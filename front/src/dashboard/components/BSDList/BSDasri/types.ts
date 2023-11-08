import { BsdasriSignatureType } from "codegen-ui";
export enum ExtraSignatureType {
  DirectTakeover = "DIRECT_TAKEOVER",
  SynthesisTakeOver = "SYNTHESIS_TAKEOVER"
}
export type SignatureType = BsdasriSignatureType | ExtraSignatureType;
