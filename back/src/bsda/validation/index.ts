import { Prisma, User } from "@prisma/client";
import { BsdaInput, BsdaSignatureType } from "../../generated/graphql/types";
import { applyDynamicRefinement } from "./dynamicRefinements";
import {
  getSignatureAncestors,
  getUnparsedBsda,
  getUpdatedFields,
  getUserFunctions
} from "./helpers";
import { checkSealedAndRequiredFields, getSealedFields } from "./rules";
import { bsdaSchema } from "./schema";
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
  input?: BsdaInput | undefined;
  persisted?: BsdaForParsing | undefined;
  isDraft?: boolean;
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
  const userFunctions = await getUserFunctions(
    validationContext.user,
    unparsedBsda
  );

  const contextualSchema = bsdaSchema
    .transform(async val => {
      const sealedFields = getSealedFields({
        bsda: val,
        persistedBsda: unparsedInputs.persisted,
        userFunctions,
        signaturesToCheck
      });
      if (validationContext.enableCompletionTransformers) {
        val = await runTransformers(val, sealedFields);
      }

      return val;
    })
    .superRefine(async (val, ctx) => {
      checkSealedAndRequiredFields(
        {
          bsda: val,
          persistedBsda: unparsedInputs.persisted,
          updatedFields,
          userFunctions,
          signaturesToCheck
        },
        ctx
      );

      await applyDynamicRefinement(val, validationContext, ctx);
    });

  return contextualSchema.parseAsync(unparsedBsda);
}
