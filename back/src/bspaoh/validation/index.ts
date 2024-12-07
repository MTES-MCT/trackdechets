import { BspaohInput, BspaohSignatureType } from "@td/codegen-back";
import { User } from "@prisma/client";
import {
  getSignatureAncestors,
  getUnparsedBspaoh,
  getUpdatedFields,
  getUserFunctions
} from "./helpers";
import { fullBspaohSchema, ZodFullBspaoh } from "./schema";
import { checkSealedAndRequiredFields, getSealedFields } from "./rules";
import { applyDynamicRefinement } from "./dynamicRefinements";
import { runTransformers } from "./transformers";
import { BspaohForParsing } from "../types";

export type UnparsedInputs = {
  input?: BspaohInput;
  persisted?: BspaohForParsing;
  isDraft?: boolean;
};

export type BspaohValidationContext = {
  enableCompletionTransformers?: boolean;
  currentSignatureType?: BspaohSignatureType;
  isCreation?: boolean;
  user?: User;
};

/**
 * Currently designed for a single transporter
 * @param unparsedInputs
 * @param validationContext
 * @returns
 */
export async function parseBspaohInContext(
  unparsedInputs: UnparsedInputs,
  validationContext: BspaohValidationContext
) {
  const unparsedBspaoh = getUnparsedBspaoh(unparsedInputs);
  const updatedFields = getUpdatedFields(unparsedInputs);

  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );

  const userFunctions = await getUserFunctions(
    validationContext.user,
    unparsedBspaoh
  );

  const contextualSchema = fullBspaohSchema
    .transform(async val => {
      // for transformers, we don't want sealed fields at creation time
      const signaturesToCheckForTransformers = validationContext?.isCreation
        ? []
        : signaturesToCheck;

      const sealedFieldsForTransformers = getSealedFields({
        bspaoh: val,
        persistedBspaoh: unparsedInputs.persisted,
        userFunctions,
        signaturesToCheck: signaturesToCheckForTransformers
      });

      if (validationContext.enableCompletionTransformers) {
        val = await runTransformers(val, sealedFieldsForTransformers);
      }

      return val;
    })
    .superRefine(async (val, ctx) => {
      checkSealedAndRequiredFields(
        {
          bspaoh: val,
          persistedBspaoh: unparsedInputs.persisted,
          updatedFields,
          userFunctions,
          signaturesToCheck
        },
        ctx
      );

      await applyDynamicRefinement(val, validationContext, ctx);
    })
    .transform(val => {
      return processDestinationWeights(val);
    });

  return contextualSchema.parseAsync(unparsedBspaoh);
}

/**
 * Compute destinationaccepted weight
 * Must run after full validation
 */
const processDestinationWeights = (val: ZodFullBspaoh) => {
  if (val?.destinationReceptionWasteReceivedWeightValue) {
    const destinationReceptionWasteAcceptedWeightValue =
      val?.destinationReceptionWasteReceivedWeightValue -
      (val?.destinationReceptionWasteRefusedWeightValue ?? 0);

    val.destinationReceptionWasteAcceptedWeightValue =
      destinationReceptionWasteAcceptedWeightValue;
  }
  return val;
};
