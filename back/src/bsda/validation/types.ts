import { ParsedZodBsda } from "./schema";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { Prisma, User } from "@prisma/client";

export type ZodBsdaTransformer = (
  bsda: ParsedZodBsda
) => ParsedZodBsda | Promise<ParsedZodBsda>;

export type BsdaValidationContext = {
  user?: User;
  currentSignatureType?: BsdaSignatureType;
  enableCompletionTransformers?: boolean;
  enablePreviousBsdasChecks?: boolean;
};

export const BsdaForParsingInclude = Prisma.validator<Prisma.BsdaInclude>()({
  intermediaries: true,
  grouping: true,
  transporters: true
});

export type PrismaBsdaForParsing = Prisma.BsdaGetPayload<{
  include: typeof BsdaForParsingInclude;
}>;
