import type {
  BsvhuError,
  BsvhuMetadataFields,
  BsvhuMetadata,
  BsvhuMetadataResolvers
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
            requiredFor: nextSignature
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
