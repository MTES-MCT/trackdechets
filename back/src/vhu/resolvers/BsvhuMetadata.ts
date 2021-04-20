import {
  BsvhuMetadata,
  BsvhuMetadataResolvers
} from "../../generated/graphql/types";
import { getFormOrFormNotFound } from "../database";
import { validateBsvhuForm } from "../validation";

const bsvhuMetadataResolvers: BsvhuMetadataResolvers = {
  errors: async (metadata: BsvhuMetadata & { id: string }) => {
    const prismaForm = await getFormOrFormNotFound(metadata.id);

    try {
      await validateBsvhuForm(prismaForm, {
        emissionSignature: true,
        transportSignature: true,
        operationSignature: true
      });
      return [];
    } catch (errors) {
      return errors.inner?.map(e => {
        return {
          message: e.message,
          path: e.path, // TODO return a path formated correctly
          requiredFor: "TRANSPORT" // TODO Identify which signature needs this field
        };
      });
    }
  }
};

export default bsvhuMetadataResolvers;
