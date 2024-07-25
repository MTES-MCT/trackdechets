import { User } from "@prisma/client";
import { ParsedZodBsvhu } from "./schema";
import { RefinementCtx } from "zod";
import { SignatureTypeInput } from "../../generated/graphql/types";

export type BsvhuUserFunctions = {
  isEmitter: boolean;
  isDestination: boolean;
  isTransporter: boolean;
};

export type BsvhuValidationContext = {
  user?: User;
  currentSignatureType?: SignatureTypeInput;
};

export type ZodBsvhuTransformer = (
  bsff: ParsedZodBsvhu,
  ctx: RefinementCtx
) => ParsedZodBsvhu | Promise<ParsedZodBsvhu>;
