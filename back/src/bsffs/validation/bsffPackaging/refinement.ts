import { Refinement, z } from "zod";
import { ParsedZodBsffPackaging } from "./schema";
import { getOperationModesFromOperationCode } from "../../../common/operationModes";
import { BsffPackagingValidationContext } from "./types";
import { getSignatureAncestors } from "./helpers";
import {
  BsffPackagingEditableFields,
  bsffPackagingEditionRules
} from "./rules";
import { capitalize } from "../../../common/strings";
import { isDestinationRefinement } from "../../../common/validation/zod/refinement";
import { isFinalOperation } from "../../constants";

/**
 * Ce refinement permet de vérifier que les établissements présents sur le
 * BsffPackaging sont bien inscrits sur Trackdéchets avec le bon profil
 */
export const checkCompanies: Refinement<ParsedZodBsffPackaging> = async (
  bsffPackaging,
  zodContext
) => {
  await isDestinationRefinement(
    bsffPackaging.operationNextDestinationCompanySiret,
    zodContext
  );
};

export const checkOperationMode: Refinement<ParsedZodBsffPackaging> = (
  bsffPackaging,
  { addIssue }
) => {
  // Vérifications sur la cohérence entre le code d'opération et le mode de traitement
  const { operationCode, operationMode } = bsffPackaging;
  if (operationCode) {
    const modes = getOperationModesFromOperationCode(operationCode);

    if (
      (modes.length && operationMode && !modes.includes(operationMode)) ||
      (!modes.length && operationMode)
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
      });
    }
  }
};

export const checkNextDestinationWhenFinalOperation: Refinement<
  ParsedZodBsffPackaging
> = (bsffPackaging, { addIssue }) => {
  if (
    bsffPackaging.operationCode &&
    isFinalOperation(bsffPackaging.operationCode)
  ) {
    if (
      bsffPackaging.operationNextDestinationCap ||
      bsffPackaging.operationNextDestinationCompanyAddress ||
      bsffPackaging.operationNextDestinationCompanyContact ||
      bsffPackaging.operationNextDestinationCompanyMail ||
      bsffPackaging.operationNextDestinationCompanyName ||
      bsffPackaging.operationNextDestinationCompanyPhone ||
      bsffPackaging.operationNextDestinationCompanySiret ||
      bsffPackaging.operationNextDestinationCompanyVatNumber ||
      bsffPackaging.operationNextDestinationPlannedOperationCode
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "L'opération de traitement renseignée ne permet pas de destination ultérieure"
      });
    }

    if (bsffPackaging.operationNoTraceability === true) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Vous ne pouvez pas indiquer une rupture de traçabilité avec un code de traitement final"
      });
    }
  }
};

export const checkAcceptationWeight: Refinement<ParsedZodBsffPackaging> = (
  bsffPackaging,
  { addIssue }
) => {
  if (bsffPackaging.acceptationStatus === "REFUSED") {
    if (
      bsffPackaging.acceptationWeight &&
      bsffPackaging.acceptationWeight > 0
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "le poids à l'acceptation doit être égal à 0 lorsque le contenant est refusé"
      });
    }
  } else if (
    bsffPackaging.acceptationStatus == "ACCEPTED" &&
    bsffPackaging.acceptationWeight === 0
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "le poids à l'acceptation doit être supérieur à 0 lorsque le contenant est accepté"
    });
  }
};

export const checkRequiredFields: (
  validationContext: BsffPackagingValidationContext
) => Refinement<ParsedZodBsffPackaging> = validationContext => {
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );

  return (bsffPackaging, { addIssue }) => {
    for (const bsffPackagingField of Object.keys(bsffPackagingEditionRules)) {
      const { required: requiredRule, readableFieldName } =
        bsffPackagingEditionRules[
          bsffPackagingField as keyof BsffPackagingEditableFields
        ];

      if (requiredRule) {
        const isRequired =
          requiredRule.from &&
          signaturesToCheck.includes(requiredRule.from) &&
          (requiredRule.when === undefined || requiredRule.when(bsffPackaging));

        if (isRequired) {
          if (bsffPackaging[bsffPackagingField] == null) {
            const fieldDescription = readableFieldName
              ? capitalize(readableFieldName)
              : `Le champ ${bsffPackagingField}`;

            addIssue({
              code: z.ZodIssueCode.custom,
              path: [bsffPackagingField],
              message: [
                `${fieldDescription} est obligatoire.`,
                requiredRule.customErrorMessage
              ]
                .filter(Boolean)
                .join(" ")
            });
          }
        }
      }
    }
  };
};
