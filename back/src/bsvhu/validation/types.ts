import { Prisma, User } from "@prisma/client";
import { ParsedZodBsvhu } from "./schema";
import { RefinementCtx } from "zod";
import type { SignatureTypeInput } from "@td/codegen-back";

export type BsvhuUserFunctions = {
  isEmitter: boolean;
  isDestination: boolean;
  isTransporter: boolean;
  isEcoOrganisme: boolean;
  isBroker: boolean;
  isTrader: boolean;
};

export type BsvhuValidationContext = {
  user?: User;
  // the last signature applied on the BSVHU
  // this is used to define which fields are required/sealed
  currentSignatureType?: SignatureTypeInput;
  // override sealed fields, so all the validation can still happen
  // for a certain level of signature, without blocking sirenify, recipify,...
  unsealed?: boolean;
};

export type ZodBsvhuTransformer = (
  bsff: ParsedZodBsvhu,
  ctx: RefinementCtx
) => ParsedZodBsvhu | Promise<ParsedZodBsvhu>;

export const BsvhuForParsingInclude = Prisma.validator<Prisma.BsvhuInclude>()({
  intermediaries: true
});

export type PrismaBsvhuForParsing = Prisma.BsvhuGetPayload<{
  include: typeof BsvhuForParsingInclude;
}>;
