import { Prisma } from "@td/prisma";
import { SignatureTypeInput } from "@td/codegen-back";
import { MultiModalSignatureType } from "../common/types";

export const BsvhuWithIntermediariesInclude = {
  intermediaries: true
} satisfies Prisma.BsvhuInclude;

export type BsvhuWithIntermediaries = Prisma.BsvhuGetPayload<{
  include: typeof BsvhuWithIntermediariesInclude;
}>;

export const BsvhuWithTransportersInclude = {
  transporters: true
} satisfies Prisma.BsvhuInclude;

export type BsvhuWithTransporters = Prisma.BsvhuGetPayload<{
  include: typeof BsvhuWithTransportersInclude;
}>;

export type AllBsvhuSignatureType =
  | SignatureTypeInput
  | MultiModalSignatureType;
