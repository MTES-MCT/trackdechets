import { ZodIssue } from "zod";
import {
  BspaohError,
  BspaohMetadata,
  BspaohMetadataFields,
  BspaohMetadataResolvers,
  BspaohStatus
} from "../../generated/graphql/types";
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
    metadata: BspaohMetadata & { id: string; status: BspaohStatus },
    _,
    context
  ): Promise<BspaohError[]> => {
    const bspaoh = await context.dataloaders.bspaohs.load(metadata.id);
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
          path: e.path,
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
    const bspaoh = await context.dataloaders.bspaohs.load(metadata.id);
    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);

    const currentSignature = getCurrentSignatureType(bspaoh);
    const currentSignatureAncestors = getSignatureAncestors(currentSignature);
    return getRequiredAndSealedFieldPaths(
      preparedExistingBspaoh,
      currentSignatureAncestors,
      context.user ?? undefined
    );
  }
};
