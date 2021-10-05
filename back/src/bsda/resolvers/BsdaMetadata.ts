import {
  BsdaMetadata,
  BsdaMetadataResolvers,
  BsdaStatus
} from "../../generated/graphql/types";
import { getBsdaOrNotFound } from "../database";
import { validateBsda } from "../validation";

export const Metadata: BsdaMetadataResolvers = {
  errors: async (
    metadata: BsdaMetadata & { id: string; status: BsdaStatus }
  ) => {
    const prismaForm = await getBsdaOrNotFound(metadata.id);

    const validationMatrix = [
      {
        skip: metadata.status !== "INITIAL",
        requiredFor: "EMISSION",
        context: {
          emissionSignature: true,
          transportSignature: false,
          workerSignature: false,
          operationSignature: false
        }
      },
      {
        skip: [
          "SIGNED_BY_WORKER",
          "SENT",
          "PROCESSED",
          "REFUSED",
          "AWAITING_CHILD"
        ].includes(metadata.status),
        requiredFor: "WORK",
        context: {
          emissionSignature: true,
          workerSignature: true,
          transportSignature: false,
          operationSignature: false
        }
      },
      {
        skip: ["SENT", "PROCESSED", "REFUSED", "AWAITING_CHILD"].includes(
          metadata.status
        ),
        requiredFor: "TRANSPORT",
        context: {
          emissionSignature: true,
          workerSignature: true,
          transportSignature: true,
          operationSignature: false
        }
      },
      {
        skip: ["PROCESSED", "REFUSED"].includes(metadata.status),
        requiredFor: "OPERATION",
        context: {
          emissionSignature: true,
          workerSignature: true,
          transportSignature: true,
          operationSignature: true
        }
      }
    ];

    const filteredValidationMatrix = validationMatrix.filter(
      matrix => !matrix.skip
    );
    for (const { context, requiredFor } of filteredValidationMatrix) {
      try {
        await validateBsda(prismaForm, [], context);
        return [];
      } catch (errors) {
        return errors.inner?.map(e => {
          return {
            message: e.message,
            path: e.path,
            requiredFor
          };
        });
      }
    }
  }
};
