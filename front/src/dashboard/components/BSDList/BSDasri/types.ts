import { BsdasriSignatureType } from "generated/graphql/types";
export enum ExtraSignatureType {
  DirectTakeover = "DIRECT_TAKEOVER",
  SynthesisTakeOver = "SYNTHESIS_TAKEOVER",
}
export type SignatureType = BsdasriSignatureType | ExtraSignatureType;
