import { ParsedZodBsda, ParsedZodBsdaTransporter } from "./schema";
import { Prisma, User } from "@td/prisma";
import { BsdaUserFunctions } from "./helpers";
import { AllBsdaSignatureType } from "../types";

export type ZodBsdaTransformer = (
  bsda: ParsedZodBsda
) => ParsedZodBsda | Promise<ParsedZodBsda>;

export type ZodBsdaTransporterTransformer = (
  bsdaTransporter: ParsedZodBsdaTransporter
) => ParsedZodBsdaTransporter | Promise<ParsedZodBsdaTransporter>;

export type BsdaValidationContext = {
  user?: User;
  currentSignatureType?: AllBsdaSignatureType;
  enableCompletionTransformers?: boolean;
  enablePreviousBsdasChecks?: boolean;
  userFunctions?: BsdaUserFunctions;
};

export const BsdaForParsingInclude = {
  intermediaries: true,
  grouping: true,
  transporters: true
} satisfies Prisma.BsdaInclude;

export type PrismaBsdaForParsing = Prisma.BsdaGetPayload<{
  include: typeof BsdaForParsingInclude;
}>;
