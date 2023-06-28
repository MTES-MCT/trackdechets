import {
  BsdaMetadata,
  BsdaMetadataResolvers,
  BsdaSignatureType,
  BsdaStatus
} from "../../generated/graphql/types";
import { getBsdaOrNotFound } from "../database";
import { parseBsda } from "../validation/validate";

export const Metadata: BsdaMetadataResolvers = {
  errors: async (
    metadata: BsdaMetadata & { id: string; status: BsdaStatus }
  ) => {
    const prismaBsda = await getBsdaOrNotFound(metadata.id);

    const validationMatrix = [
      {
        skip: metadata.status !== "INITIAL",
        requiredFor: "EMISSION",
        currentSignatureType: "EMISSION" as BsdaSignatureType
      },
      {
        skip: [
          "SIGNED_BY_WORKER",
          "SENT",
          "PROCESSED",
          "REFUSED",
          "AWAITING_CHILD"
        ].includes(metadata.status),
        currentSignatureType: "WORK" as BsdaSignatureType
      },
      {
        skip: ["SENT", "PROCESSED", "REFUSED", "AWAITING_CHILD"].includes(
          metadata.status
        ),
        currentSignatureType: "TRANSPORT" as BsdaSignatureType
      },
      {
        skip: ["PROCESSED", "REFUSED"].includes(metadata.status),
        currentSignatureType: "OPERATION" as BsdaSignatureType
      }
    ];

    const filteredValidationMatrix = validationMatrix.filter(
      matrix => !matrix.skip
    );
    for (const { currentSignatureType } of filteredValidationMatrix) {
      try {
        await parseBsda(prismaBsda, {
          currentSignatureType
        });
        return [];
      } catch (errors) {
        return errors.inner?.map(e => {
          return {
            message: e.message,
            path: e.path,
            requiredFor: currentSignatureType
          };
        });
      }
    }
  }
};
