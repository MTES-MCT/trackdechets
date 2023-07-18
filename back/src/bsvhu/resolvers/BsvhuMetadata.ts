import { getTransporterReceipt } from "../../bsdasris/recipify";
import {
  BsvhuMetadata,
  BsvhuMetadataResolvers,
  BsvhuStatus
} from "../../generated/graphql/types";
import { getBsvhuOrNotFound } from "../database";
import { validateBsvhu } from "../validation";

const bsvhuMetadataResolvers: BsvhuMetadataResolvers = {
  errors: async (
    metadata: BsvhuMetadata & { id: string; status: BsvhuStatus }
  ) => {
    const prismaBsvhu = await getBsvhuOrNotFound(metadata.id);

    const validationMatrix = [
      {
        skip: metadata.status !== "INITIAL",
        requiredFor: "EMISSION",
        context: {
          emissionSignature: true,
          transportSignature: false,
          operationSignature: false
        }
      },
      {
        skip: ["PROCESSED", "REFUSED", "SENT"].includes(metadata.status),
        requiredFor: "TRANSPORT",
        context: {
          emissionSignature: true,
          transportSignature: true,
          operationSignature: false
        }
      },
      {
        skip: ["PROCESSED", "REFUSED"].includes(metadata.status),
        requiredFor: "OPERATION",
        context: {
          emissionSignature: true,
          transportSignature: true,
          operationSignature: true
        }
      }
    ];

    const filteredValidationMatrix = validationMatrix.filter(
      matrix => !matrix.skip
    );

    // import transporterReceipt that will be completed after transporter signature
    const transporterReceipt = await getTransporterReceipt(prismaBsvhu);

    for (const { context, requiredFor } of filteredValidationMatrix) {
      try {
        await validateBsvhu(
          {
            ...prismaBsvhu,
            ...transporterReceipt
          },
          context
        );
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

export default bsvhuMetadataResolvers;
