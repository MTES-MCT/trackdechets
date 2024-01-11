import { prisma } from "@td/prisma";
import {
  FormMetadata,
  FormMetadataResolvers
} from "../../../generated/graphql/types";

export const Metadata: FormMetadataResolvers = {
  latestRevision: async (metadata: FormMetadata & { id: string }) => {
    // When loaded from ES, this field is already populated
    // We check only for undefined as the field can be null
    if (metadata.latestRevision !== undefined) {
      return metadata.latestRevision;
    }

    const revisions = await prisma.form
      .findUnique({ where: { id: metadata.id } })
      .bsddRevisionRequests();

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
