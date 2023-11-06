import { Bsdasri } from "@prisma/client";
import {
  BsdasriMetadata,
  BsdasriMetadataResolvers
} from "../../generated/graphql/types";
import { getBsdasriOrNotFound } from "../database";
import { validateBsdasri, getRequiredFor } from "../validation";
import { ValidationError } from "yup";

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
  }
};

export default bsdasriMetadataResolvers;
