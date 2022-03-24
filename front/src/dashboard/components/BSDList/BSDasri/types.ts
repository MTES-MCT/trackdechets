import { BsdasriSignatureType } from "generated/graphql/types";
export enum ExtraSignatureType {
  DirectTakeover = "DIRECT_TAKEOVER",
  SynthesisEmission = "SYNTHESIS_EMISSION",
  SynthesisTransporter = "SYNTHESIS_TRANSPORTER",
}
export type SignatureType = BsdasriSignatureType | ExtraSignatureType;
