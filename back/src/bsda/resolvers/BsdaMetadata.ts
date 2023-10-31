import { ZodIssue } from "zod";
import {
  BsdaMetadata,
  BsdaMetadataResolvers,
  BsdaStatus
} from "../../generated/graphql/types";
import { getBsdaOrNotFound } from "../database";
import { parseBsdaInContext } from "../validation";

function getNextSignature(bsda) {
  if (bsda.destinationOperationSignatureAuthor != null) return "OPERATION";
  if (bsda.transporterTransportSignatureAuthor != null) return "TRANSPORT";
  if (bsda.workerWorkSignatureAuthor != null) return "WORK";
  return "EMISSION";
}

export const Metadata: BsdaMetadataResolvers = {
  errors: async (
    metadata: BsdaMetadata & { id: string; status: BsdaStatus }
  ) => {
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
  }
};
