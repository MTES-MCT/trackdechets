import { ZodIssue } from "zod";
import {
  BspaohError,
  BspaohMetadata,
  BspaohMetadataFields,
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
import { getRequiredAndSealedFieldPaths } from "../validation/rules";
import { getSignatureAncestors } from "../validation/helpers";

export const Metadata: BspaohMetadataResolvers = {
  errors: async (
    metadata: BspaohMetadata & { id: string; status: BspaohStatus }
  ): Promise<BspaohError[]> => {
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
          path: `${e.path.join(".")}`, // e.path is an array, first element should be the path name
          requiredFor: nextSignatureType
        };
      });
    }
  },
  fields: async (
    metadata: BspaohMetadata & { id: string },
    _,
    context
  ): Promise<BspaohMetadataFields> => {
    const bspaoh = await getBspaohOrNotFound({ id: metadata.id });
    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);

    const currentSignature = getCurrentSignatureType(bspaoh);
    const nextSignature = getNextSignatureType(bspaoh);
    const currentSignatureAncestors = getSignatureAncestors(currentSignature);
    return getRequiredAndSealedFieldPaths(
      preparedExistingBspaoh,
      currentSignatureAncestors,
      nextSignature,
      context.user ?? undefined
    );
  }
};
