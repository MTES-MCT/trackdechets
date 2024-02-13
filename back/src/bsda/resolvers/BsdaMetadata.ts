import { ZodIssue } from "zod";
import {
  BsdaMetadata,
  BsdaMetadataResolvers
} from "../../generated/graphql/types";
import { syncParseBsdaInContext } from "../validation";
import { prisma } from "@td/prisma";
import { computeLatestRevision } from "../converter";

function getNextSignature(bsda) {
  if (bsda.destinationOperationSignatureAuthor != null) return "OPERATION";
  if (bsda.transporterTransportSignatureAuthor != null) return "TRANSPORT";
  if (bsda.workerWorkSignatureAuthor != null) return "WORK";
  return "EMISSION";
}

export const Metadata: BsdaMetadataResolvers = {
  errors: async (metadata: BsdaMetadata & { id: string }, _, context) => {
    const bsda = await context.dataloaders.bsdas.load(metadata.id);
    const userCompanies = await context.dataloaders.userCompanies.load(
      context.user!.id
    );

    const currentSignatureType = getNextSignature(bsda);
    try {
      syncParseBsdaInContext(
        { persisted: bsda },
        {
          currentSignatureType,
          userCompanies
        }
      );
      return [];
    } catch (errors) {
      return errors.issues?.map((e: ZodIssue) => {
        return {
          message: e.message,
          path: `${e.path[0]}`, // e.path is an array, first element should be the path name
          requiredFor: currentSignatureType
        };
      });
    }
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
