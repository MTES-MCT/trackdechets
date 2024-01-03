import { ZodIssue } from "zod";
import {
  BsdaMetadata,
  BsdaMetadataResolvers
} from "../../generated/graphql/types";
import { getBsdaOrNotFound } from "../database";
import { parseBsdaInContext } from "../validation";
import prisma from "../../prisma";

function getNextSignature(bsda) {
  if (bsda.destinationOperationSignatureAuthor != null) return "OPERATION";
  if (bsda.transporterTransportSignatureAuthor != null) return "TRANSPORT";
  if (bsda.workerWorkSignatureAuthor != null) return "WORK";
  return "EMISSION";
}

export const Metadata: BsdaMetadataResolvers = {
  errors: async (metadata: BsdaMetadata & { id: string }) => {
    const bsda = await getBsdaOrNotFound(metadata.id, {
      include: { intermediaries: true, grouping: true, forwarding: true }
    });

    const currentSignatureType = getNextSignature(bsda);
    try {
      await parseBsdaInContext(
        { persisted: bsda },
        {
          currentSignatureType
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

    return revisions && revisions.length > 0
      ? (revisions.reduce((latestRevision, currentRevision) => {
          if (
            !latestRevision ||
            currentRevision.updatedAt > latestRevision.updatedAt
          ) {
            return currentRevision;
          }
          return latestRevision;
        }) as any)
      : null; // Typing as any because some properties are loaded in sub resolvers. Hence the type is not complete.
  }
};
