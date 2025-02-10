import { RefinementCtx } from "zod";
import type { BsffSignatureType } from "@td/codegen-back";
import { ParsedZodBsffPackaging } from "./schema";

export type BsffPackagingValidationContext = {
  currentSignatureType?: BsffPackagingSignatureType;
};

export type BsffPackagingSignatureType = Extract<
  BsffSignatureType,
  "ACCEPTATION" | "OPERATION"
>;

export type ZodBsffPackagingTransformer = (
  bsffPackaging: ParsedZodBsffPackaging,
  ctx: RefinementCtx
) => ParsedZodBsffPackaging | Promise<ParsedZodBsffPackaging>;
