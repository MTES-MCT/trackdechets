import { Bsdasri } from "@prisma/client";
import type {
  BsdasriMetadata,
  BsdasriMetadataResolvers
} from "@td/codegen-back";
import { getBsdasriOrNotFound } from "../database";
import { validateBsdasri, getRequiredFor } from "../validation";
import { ValidationError } from "yup";
import { prisma } from "@td/prisma";
import { computeLatestRevision } from "../converter";

const bsdasriMetadataResolvers: BsdasriMetadataResolvers = {
  errors: async (metadata: BsdasriMetadata & { id: string }) => {
    const bsdasri: Bsdasri = await getBsdasriOrNotFound({ id: metadata.id });

    try {
      await validateBsdasri(bsdasri as any, {
        emissionSignature: true,
        transportSignature: true,
        receptionSignature: true,
        operationSignature: true
      });
      return [];
    } catch (errors) {
      return errors.inner?.map((e: ValidationError) => ({
        message: e.message,
        path: e.path ?? "",
        requiredFor: getRequiredFor(e.path)
      }));
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
