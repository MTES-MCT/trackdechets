import { Bsdasri } from "@prisma/client";
import type {
  BsdasriMetadata,
  BsdasriMetadataResolvers
} from "@td/codegen-back";
import { getFullBsdasriOrNotFound } from "../database";
import { getTransporterReceipt } from "../../companies/recipify";

import { prisma } from "@td/prisma";
import { computeLatestRevision } from "../converter";
import { parseBsdasri } from "../validation";
import { prismaToZodBsdasri } from "../validation/helpers";

import { ZodIssue } from "zod";

function getNextSignature(bsdasri: Bsdasri) {
  if (bsdasri.destinationOperationSignatureAuthor != null) return "OPERATION";
  if (bsdasri.destinationReceptionSignatureAuthor != null) return "RECEPTION";
  if (bsdasri.transporterTransportSignatureAuthor != null) return "TRANSPORT";

  return "EMISSION";
}

const bsdasriMetadataResolvers: BsdasriMetadataResolvers = {
  errors: async (metadata: BsdasriMetadata & { id: string }) => {
    const bsdasri = await getFullBsdasriOrNotFound(metadata.id, {
      include: {
        grouping: true,
        synthesizing: true
      }
    });
    const transporterReceipt = await getTransporterReceipt(bsdasri);

    const zodBsdasri = prismaToZodBsdasri({
      ...bsdasri,
      ...transporterReceipt
    });
    const currentSignature = getNextSignature(bsdasri);

    try {
      parseBsdasri(zodBsdasri, {
        currentSignatureType: currentSignature
      });
      return [];
    } catch (errors) {
      return errors.issues?.map((e: ZodIssue) => {
        return {
          message: e.message,
          path: `${e.path[0]}`, // e.path is an array, first element should be the path name
          requiredFor: [currentSignature]
        };
      });
    }
  },

  latestRevision: async (metadata: BsdasriMetadata & { id: string }) => {
    // When loaded from ES, this field is already populated
    // We check only for undefined as the field can be null
    if (metadata.latestRevision !== undefined) {
      return metadata.latestRevision;
    }

    const revisions = await prisma.bsdasri
      .findUnique({ where: { id: metadata.id } })
      .bsdasriRevisionRequests();

    return computeLatestRevision(revisions) as any;
  }
};

export default bsdasriMetadataResolvers;
