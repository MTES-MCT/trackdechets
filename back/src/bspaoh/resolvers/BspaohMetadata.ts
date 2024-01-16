import { ZodIssue } from "zod";
import {
  BspaohMetadata,
  BspaohMetadataResolvers,
  BspaohStatus
} from "../../generated/graphql/types";
import { getBspaohOrNotFound } from "../database";
import { parseBspaohInContext } from "../validation";
import {
  prepareBspaohForParsing,
  getNextSignatureType,
  getCurrentSignatureType
} from "./mutations/utils";
import {
  getSealedFieldsForSignature,
  prismaFieldsToGqlPaths
} from "../validation/rules";

export const Metadata: BspaohMetadataResolvers = {
  errors: async (
    metadata: BspaohMetadata & { id: string; status: BspaohStatus }
  ) => {
    const bspaoh = await getBspaohOrNotFound({ id: metadata.id });
    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    const nextSignatureType = getNextSignatureType(bspaoh);
    try {
      await parseBspaohInContext(
        { persisted: preparedExistingBspaoh },
        {
          currentSignatureType: nextSignatureType
        }
      );
      return [];
    } catch (errors) {
      return errors.issues?.map((e: ZodIssue) => {
        return {
          message: e.message,
          path: `${e.path[0]}`, // e.path is an array, first element should be the path name
          requiredFor: nextSignatureType
        };
      });
    }
  },
  fields: async (metadata: BspaohMetadata & { id: string }) => {
    const bspaoh = await getBspaohOrNotFound({ id: metadata.id });
    const signatureType = getCurrentSignatureType(bspaoh);
    const fields = getSealedFieldsForSignature(signatureType);
    return {
      sealed: fields.map(f => ({ name: prismaFieldsToGqlPaths[f] ?? f }))
    };
  }
};
