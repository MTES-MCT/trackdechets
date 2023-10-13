import { Prisma, User } from "@prisma/client";
import { BsdaInput, BsdaSignatureType } from "../../generated/graphql/types";
import { applyContextualAndAsyncRefinement } from "./dynamicRefinements";
import {
  getSignatureAncestors,
  getUnparsedBsda,
  getUpdatedFields,
  getUserFunctions
} from "./helpers";
import { checkSealedAndRequiredFields, getSealedFields } from "./rules";
import { rawBsdaSchema } from "./schema";
import { runTransformers } from "./transformers";

export type BsdaValidationContext = {
  enablePreviousBsdasChecks?: boolean;
  enableCompletionTransformers?: boolean;
  currentSignatureType?: BsdaSignatureType;
  user?: User;
};

const existingBsdaForParsing = Prisma.validator<Prisma.BsdaInclude>()({
  intermediaries: true,
  grouping: true,
  forwarding: true
});

type BsdaForParsing = Prisma.BsdaGetPayload<{
  include: typeof existingBsdaForParsing;
}>;

export type UnparsedInputs = {
  input?: (BsdaInput & { isDraft?: boolean }) | undefined;
  persisted?: BsdaForParsing | undefined;
};

export async function parseBsdaInContext(
  unparsedInputs: UnparsedInputs,
  validationContext: BsdaValidationContext
) {
  const unparsedBsda = getUnparsedBsda(unparsedInputs);
  const updatedFields = getUpdatedFields(unparsedInputs);
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );
  const userFunctions = await getUserFunctions(validationContext.user, unparsedBsda);

  const contextualSchema = rawBsdaSchema
    .transform(async val => {
      const sealedFields = getSealedFields({ bsda: val, userFunctions, signaturesToCheck });
      if (validationContext.enableCompletionTransformers) {
        val = await runTransformers(val, sealedFields);
      }

      return val;
    })
    .superRefine(async (val, ctx) => {
      checkSealedAndRequiredFields(
        { bsda: val, updatedFields, userFunctions, signaturesToCheck },
        ctx
      );

      await applyContextualAndAsyncRefinement(val, validationContext, ctx);
    });

  return contextualSchema.parseAsync(unparsedBsda);
}
