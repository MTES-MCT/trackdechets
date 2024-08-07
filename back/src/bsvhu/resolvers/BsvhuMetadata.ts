import { ValidationError } from "yup";
import { getTransporterReceipt } from "../../companies/recipify";
import {
  BsvhuMetadata,
  BsvhuMetadataResolvers,
  BsvhuStatus
} from "../../generated/graphql/types";
import { getBsvhuOrNotFound } from "../database";
import { parseBsvhu } from "../validation";
import { prismaToZodBsvhu } from "../validation/helpers";
import { SignatureTypeInput } from "../../generated/graphql/types";

const bsvhuMetadataResolvers: BsvhuMetadataResolvers = {
  errors: async (
    metadata: BsvhuMetadata & { id: string; status: BsvhuStatus }
  ) => {
    const prismaBsvhu = await getBsvhuOrNotFound(metadata.id);

    const validationMatrix = [
      {
        skip: metadata.status !== "INITIAL",
        requiredFor: "EMISSION"
      },
      {
        skip: ["PROCESSED", "REFUSED", "SENT"].includes(metadata.status),
        requiredFor: "TRANSPORT"
      },
      {
        skip: ["PROCESSED", "REFUSED"].includes(metadata.status),
        requiredFor: "OPERATION"
      }
    ];

    const filteredValidationMatrix = validationMatrix.filter(
      matrix => !matrix.skip
    );

    // import transporterReceipt that will be completed after transporter signature
    const transporterReceipt = await getTransporterReceipt(prismaBsvhu);
    const zodBsvhu = prismaToZodBsvhu({
      ...prismaBsvhu,
      ...transporterReceipt
    });

    for (const { requiredFor } of filteredValidationMatrix) {
      try {
        parseBsvhu(zodBsvhu, {
          currentSignatureType: requiredFor as SignatureTypeInput
        });
        return [];
      } catch (errors) {
        return errors.inner?.map((e: ValidationError) => {
          return {
            message: e.message,
            path: e.path ?? "",
            requiredFor
          };
        });
      }
    }
  }
};

export default bsvhuMetadataResolvers;
