import { ZodIssue } from "zod";
import type {
  BsdaMetadata,
  BsdaMetadataFields,
  BsdaMetadataResolvers
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { computeLatestRevision } from "../converter";
import { parseBsda } from "../validation";
import {
  getCurrentSignatureType,
  getNextSignatureType,
  getSignatureAncestors,
  prismaToZodBsda
} from "../validation/helpers";
import { getRequiredAndSealedFieldPaths } from "../validation/rules";

export const Metadata: BsdaMetadataResolvers = {
  errors: async (metadata: BsdaMetadata & { id: string }, _, context) => {
    const bsda = await context.dataloaders.bsdas.load(metadata.id);

    const zodBsda = prismaToZodBsda(bsda);
    const currentSignature = getCurrentSignatureType(zodBsda);
    const nextSignature = getNextSignatureType(currentSignature);
    try {
      parseBsda(zodBsda, {
        currentSignatureType: nextSignature
      });
      return [];
    } catch (errors) {
      return errors.issues?.map((e: ZodIssue) => {
        return {
          message: e.message,
          path: e.path,
          requiredFor: nextSignature
        };
      });
    }
  },
  fields: async (
    metadata: BsdaMetadata & { id: string },
    _,
    context
  ): Promise<BsdaMetadataFields> => {
    const bsda = await context.dataloaders.bsdas.load(metadata.id);
    const zodBsda = prismaToZodBsda(bsda);
    const currentSignature = getCurrentSignatureType(zodBsda);
    const currentSignatureAncestors = getSignatureAncestors(currentSignature);
    return getRequiredAndSealedFieldPaths(
      zodBsda,
      currentSignatureAncestors,
      context.user ?? undefined
    );
  },
  latestRevision: async (metadata: BsdaMetadata & { id: string }) => {
    // When loaded from ES, this field is already populated
    // We check only for undefined as the field can be null
    if (metadata.latestRevision !== undefined) {
      return metadata.latestRevision;
    }

    const revisions = await prisma.bsda
      .findUnique({ where: { id: metadata.id } })
      .bsdaRevisionRequests();

    return computeLatestRevision(revisions) as any; // Typing as any because some properties are loaded in sub resolvers. Hence the type is not complete.
  }
};
