import { Prisma, User } from "@prisma/client";
import { ParsedZodBsff, ParsedZodBsffTransporter } from "./schema";
import { RefinementCtx } from "zod";
import { MultiModalSignatureType } from "../../../common/types";
import { BsffSignatureType } from "@td/codegen-back";

export type BsffUserFunctions = {
  isEmitter: boolean;
  isDestination: boolean;
  isTransporter: boolean;
};

export type BsffValidationContext = {
  user?: User;
  currentSignatureType?: AllBsffSignatureType;
  userFunctions?: BsffUserFunctions;
};

export type ZodBsffTransformer = (
  bsff: ParsedZodBsff,
  ctx: RefinementCtx
) => ParsedZodBsff | Promise<ParsedZodBsff>;

export type ZodBsffTransporterTransformer = (
  bsffTransporter: ParsedZodBsffTransporter
) => ParsedZodBsffTransporter | Promise<ParsedZodBsffTransporter>;

export const BsffForParsingInclude = Prisma.validator<Prisma.BsffInclude>()({
  transporters: true,
  packagings: { include: { previousPackagings: true } },
  ficheInterventions: true
});

export type PrismaBsffForParsing = Prisma.BsffGetPayload<{
  include: typeof BsffForParsingInclude;
}>;

export type AllBsffSignatureType = BsffSignatureType | MultiModalSignatureType;
