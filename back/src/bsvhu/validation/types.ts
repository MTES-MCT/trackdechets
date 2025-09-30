import { Prisma, User } from "@td/prisma";
import { ParsedZodBsvhu, ParsedZodBsvhuTransporter } from "./schema";
import { RefinementCtx } from "zod";
import { AllBsvhuSignatureType } from "../types";

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
  currentSignatureType?: AllBsvhuSignatureType;
  // override sealed fields, so all the validation can still happen
  // for a certain level of signature, without blocking sirenify, recipify,...
  unsealed?: boolean;
};

export type ZodBsvhuTransformer = (
  bsvhu: ParsedZodBsvhu,
  ctx: RefinementCtx
) => ParsedZodBsvhu | Promise<ParsedZodBsvhu>;

export type ZodBsvhuTransporterTransformer = (
  bsvhuTransporter: ParsedZodBsvhuTransporter
) => ParsedZodBsvhuTransporter | Promise<ParsedZodBsvhuTransporter>;

export const BsvhuForParsingInclude = {
  intermediaries: true,
  transporters: true
} satisfies Prisma.BsvhuInclude;

export type PrismaBsvhuForParsing = Prisma.BsvhuGetPayload<{
  include: typeof BsvhuForParsingInclude;
}>;
