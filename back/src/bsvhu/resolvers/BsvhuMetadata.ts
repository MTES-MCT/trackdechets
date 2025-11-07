import type {
  BsvhuError,
  BsvhuMetadataFields,
  BsvhuMetadata,
  BsvhuMetadataResolvers,
  SignatureTypeInput
} from "@td/codegen-back";
import { parseBsvhu } from "../validation";
import {
  getCurrentSignatureType,
  getNextSignatureType,
  getSignatureAncestors,
  prismaToZodBsvhu
} from "../validation/helpers";
import { ZodIssue } from "zod";
import { getRequiredAndSealedFieldPaths } from "../validation/rules";
import { AllBsvhuSignatureType } from "../types";

function getNextSignatureForErrors(
  nextSignatureType: AllBsvhuSignatureType | undefined
): SignatureTypeInput | undefined {
  return nextSignatureType
    ? nextSignatureType.startsWith("TRANSPORT")
      ? "TRANSPORT"
      : (nextSignatureType as SignatureTypeInput)
    : undefined;
}

const bsvhuMetadataResolvers: BsvhuMetadataResolvers = {
  errors: async (
    metadata: BsvhuMetadata & { id: string },
    _,
    context
  ): Promise<BsvhuError[]> => {
    const bsvhu = await context.dataloaders.bsvhus.load(metadata.id);
    const zodBsvhu = prismaToZodBsvhu(bsvhu);
    const currentSignature = getCurrentSignatureType(zodBsvhu);
    const nextSignature = getNextSignatureType(currentSignature);
    const nextSignatureForErrors = getNextSignatureForErrors(nextSignature);
    try {
      parseBsvhu(zodBsvhu, {
        currentSignatureType: nextSignature
      });
      return [];
    } catch (errors) {
      return (
        errors.issues?.map((e: ZodIssue) => {
          return {
            message: e.message,
            path: e.path,
            requiredFor: nextSignatureForErrors
          };
        }) ?? []
      );
    }
  },
  fields: async (
    metadata: BsvhuMetadata & { id: string },
    _,
    context
  ): Promise<BsvhuMetadataFields> => {
    const bsvhu = await context.dataloaders.bsvhus.load(metadata.id);
    const zodBsvhu = prismaToZodBsvhu(bsvhu);
    const currentSignature = getCurrentSignatureType(zodBsvhu);
    const currentSignatureAncestors = getSignatureAncestors(currentSignature);
    return getRequiredAndSealedFieldPaths(
      zodBsvhu,
      currentSignatureAncestors,
      context.user ?? undefined
    );
  }
};

export default bsvhuMetadataResolvers;
