import type {
  BsffError,
  BsffMetadataFields,
  BsffMetadata,
  BsffSignatureType,
  BsffMetadataResolvers
} from "@td/codegen-back";
import { parseBsff } from "../validation/bsff";
import {
  getCurrentSignatureType,
  getNextSignatureType,
  getSignatureAncestors,
  prismaToZodBsff
} from "../validation/bsff/helpers";
import { ZodIssue } from "zod";
import { getRequiredAndSealedFieldPaths } from "../validation/bsff/rules";
import { AllBsffSignatureType } from "../validation/bsff/types";

function getNextSignatureForErrors(
  nextSignatureType: AllBsffSignatureType | undefined
): BsffSignatureType | undefined {
  return nextSignatureType
    ? nextSignatureType.startsWith("TRANSPORT")
      ? "TRANSPORT"
      : (nextSignatureType as BsffSignatureType)
    : undefined;
}

const bsffMetadataResolvers: BsffMetadataResolvers = {
  errors: async (
    metadata: BsffMetadata & { id: string },
    _,
    context
  ): Promise<BsffError[]> => {
    const bsff = await context.dataloaders.bsffs.load(metadata.id);
    const zodBsff = prismaToZodBsff(bsff);
    const currentSignature = getCurrentSignatureType(zodBsff);
    const nextSignature = getNextSignatureType(currentSignature);
    const nextSignatureForErrors = getNextSignatureForErrors(nextSignature);
    try {
      parseBsff(zodBsff, {
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
    metadata: BsffMetadata & { id: string },
    _,
    context
  ): Promise<BsffMetadataFields> => {
    const bsff = await context.dataloaders.bsffs.load(metadata.id);
    const zodBsff = prismaToZodBsff(bsff);
    const currentSignature = getCurrentSignatureType(zodBsff);
    const currentSignatureAncestors = getSignatureAncestors(currentSignature);
    return getRequiredAndSealedFieldPaths(
      zodBsff,
      currentSignatureAncestors,
      context.user ?? undefined
    );
  }
};

export default bsffMetadataResolvers;
