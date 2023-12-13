import { ZodIssue } from "zod";
import {
  BsdaMetadata,
  BsdaMetadataResolvers,
  BsdaStatus
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
  },
  revisionsInfos: async (metadata: BsdaMetadata & { id: string }) => {
    // When we load a BSDA from ES, the revision metadata are already hydrated
    if (metadata.revisionsInfos) {
      return metadata.revisionsInfos;
    }

    const revisions = await prisma.bsda
      .findUnique({ where: { id: metadata.id } })
      .bsdaRevisionRequests({ include: { approvals: true } });

    const hasBeenRevised = revisions?.some(
      revision => revision.status !== "PENDING"
    );
    const activeRevision = revisions?.find(
      revision => revision.status === "PENDING"
    );

    return {
      hasBeenRevised: Boolean(hasBeenRevised),
      activeRevision: activeRevision
        ? {
            author: activeRevision.authoringCompanyId,
            approvedBy: activeRevision.approvals.map(a => a.approverSiret)
          }
        : undefined
    };
  }
};
