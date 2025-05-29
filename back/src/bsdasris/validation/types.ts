import { Prisma, User } from "@prisma/client";
import { ParsedZodBsdasri } from "./schema";
import { RefinementCtx } from "zod";
import type { SignatureTypeInput } from "@td/codegen-back";

export type BsdasriUserFunctions = {
  isEmitter: boolean;
  isDestination: boolean;
  isTransporter: boolean;
  isEcoOrganisme: boolean;
};

export type BsdasriValidationContext = {
  user?: User;
  // the last signature applied on the Bsdasri
  // this is used to define which fields are required/sealed
  currentSignatureType?: SignatureTypeInput;

  // override sealed fields, so all the validation can still happen
  // for a certain level of signature, without blocking sirenify, recipify,...
  unsealed?: boolean;
};

export type ZodBsdasriTransformer = (
  bsdasri: ParsedZodBsdasri,
  ctx: RefinementCtx
) => ParsedZodBsdasri | Promise<ParsedZodBsdasri>;

export const BsdasriForParsingInclude =
  Prisma.validator<Prisma.BsdasriInclude>()({
    grouping: true,
    synthesizing: true
  });

export type PrismaBsdasriForParsing = Prisma.BsdasriGetPayload<{
  include: typeof BsdasriForParsingInclude;
}>;
