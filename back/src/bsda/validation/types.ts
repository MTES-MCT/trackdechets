import { ParsedZodBsda, ParsedZodBsdaTransporter } from "./schema";
import { Prisma, User } from "@prisma/client";
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
  isSignatureStep?: boolean;
};

export const BsdaForParsingInclude = Prisma.validator<Prisma.BsdaInclude>()({
  intermediaries: true,
  grouping: true,
  transporters: true
});

export type PrismaBsdaForParsing = Prisma.BsdaGetPayload<{
  include: typeof BsdaForParsingInclude;
}>;
