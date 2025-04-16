import { Refinement, RefinementCtx, z } from "zod";
import { ParsedZodBsdasri, ZodBsdasri } from "./schema";
import { BsdasriValidationContext } from "./types";
import { getSignatureAncestors } from "./helpers";
import {
  BsdasriEditableFields,
  bsdasriEditionRules,
  isBsdasriFieldRequired
} from "./rules";
import { isArray } from "../../common/dataTypes";
import { capitalize } from "../../common/strings";
import { EditionRule, EditionRulePath } from "./rules";
import { BsdType, WasteAcceptationStatus, TransportMode } from "@prisma/client";
import {
  destinationOperationModeRefinement,
  isDestinationRefinement,
  isEcoOrganismeRefinement,
  isEmitterRefinement,
  isRegisteredVatNumberRefinement,
  isTransporterRefinement
} from "../../common/validation/zod/refinement";
import { onlyWhiteSpace } from "../../common/validation/zod/refinement";
import { isDefined } from "../../common/helpers";
import { v20250201 } from "../../common/validation";
import {
  ERROR_TRANSPORTER_PLATES_INCORRECT_FORMAT,
  ERROR_TRANSPORTER_PLATES_INCORRECT_LENGTH
} from "../../common/validation/messages";
import { ParsedZodBsvhu } from "../../bsvhu/validation/schema";

export const checkWeights: Refinement<ParsedZodBsdasri> = (
  bsdasri,
  { addIssue }
) => {
  // emitter
  if (
    !isDefined(bsdasri.emitterWasteWeightIsEstimate) &&
    bsdasri.emitterWasteWeightValue
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      path: ["emitter", "emission", "weight", "value"],
      message:
        "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets émis."
    });
  }

  if (
    bsdasri.emitterWasteWeightIsEstimate &&
    !bsdasri.emitterWasteWeightValue
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      path: ["emitter", "emission", "weight", "isEstimate"],
      message:
        "Le poids de déchets émis en kg est obligatoire si vous renseignez le type de pesée."
    });
  }

  // transporter

  if (
    bsdasri.transporterWasteWeightIsEstimate &&
    !bsdasri.transporterWasteWeightValue
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      path: ["transporter", "transport", "weight", "isEstimate"],
      message:
        "Le poids de déchets transportés en kg est obligatoire si vous renseignez le type de pesée."
    });
  }

  if (
    !isDefined(bsdasri.transporterWasteWeightIsEstimate) &&
    bsdasri.transporterWasteWeightValue
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      path: ["transporter", "transport", "weight", "value"],
      message:
        "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets transportés"
    });
  }
};

/**
 * Ce refinement permet de vérifier que les établissements présents sur le
 * Bsdasri sont bien inscrits sur Trackdéchets avec le bon profil
 */
export const checkCompanies: Refinement<ParsedZodBsdasri> = async (
  bsdasri,
  zodContext
) => {
  await isEmitterRefinement(
    bsdasri.emitterCompanySiret,
    BsdType.BSDASRI,
    zodContext
  );
  await isDestinationRefinement(bsdasri.destinationCompanySiret, zodContext);

  await isTransporterRefinement(
    {
      siret: bsdasri.transporterCompanySiret,
      transporterRecepisseIsExempted:
        bsdasri.transporterRecepisseIsExempted ?? false
    },
    zodContext
  );
  await isRegisteredVatNumberRefinement(
    bsdasri.transporterCompanyVatNumber,
    zodContext
  );
  await isEcoOrganismeRefinement(
    bsdasri.ecoOrganismeSiret,
    BsdType.BSDASRI,
    zodContext
  );
};

// Until multiple transporters implementation, we use this refinement instead of common `validateTransporterPlates`
export const validateBsdasriTransporterPlates: Refinement<ParsedZodBsdasri> = (
  bsdasri,
  zodContext
) => {
  const { transporterTransportPlates, createdAt } = bsdasri;

  const path = ["transporter", "transport", "plates"];

  const createdAfterV20250201 =
    (createdAt || new Date()).getTime() > v20250201.getTime();

  if (!createdAfterV20250201 || !transporterTransportPlates) {
    return;
  }
  if (
    transporterTransportPlates.some(
      plate => plate.length > 12 || plate.length < 4
    )
  ) {
    zodContext.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_TRANSPORTER_PLATES_INCORRECT_LENGTH,
      path
    });
    return;
  }

  if (transporterTransportPlates.some(plate => onlyWhiteSpace(plate))) {
    zodContext.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_TRANSPORTER_PLATES_INCORRECT_FORMAT,
      path
    });
  }
};

export const checkOperationMode: Refinement<ParsedZodBsdasri> = (
  bsdasri,
  zodContext
) => {
  destinationOperationModeRefinement(
    bsdasri.destinationOperationCode,
    bsdasri.destinationOperationMode,
    zodContext
  );
};

type CheckFieldIsDefinedArgs<T extends ZodBsdasri> = {
  resource: T;
  field: string;
  rule: EditionRule<T>;
  readableFieldName?: string;
  path?: EditionRulePath;
  ctx: RefinementCtx;
  errorMsg?: (fieldDescription: string) => string;
};

function checkFieldIsDefined<T extends ZodBsdasri>(
  args: CheckFieldIsDefinedArgs<T>
) {
  const { resource, field, rule, ctx, readableFieldName, path, errorMsg } =
    args;
  const value = resource[field];

  if (value == null || (isArray(value) && (value as any[]).length === 0)) {
    const fieldDescription = readableFieldName
      ? capitalize(readableFieldName)
      : `Le champ ${field}`;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: path ?? [field],
      message: [
        errorMsg
          ? errorMsg(fieldDescription)
          : `${fieldDescription} est un champ requis.`,
        rule.customErrorMessage
      ]
        .filter(Boolean)
        .join(" ")
    });
  }
}

export const checkRequiredFields: (
  validationContext: BsdasriValidationContext
) => Refinement<ParsedZodBsdasri> = validationContext => {
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );

  return (bsdasri, zodContext) => {
    for (const bsdasriField of Object.keys(bsdasriEditionRules)) {
      const { required, readableFieldName, path } =
        bsdasriEditionRules[bsdasriField as keyof BsdasriEditableFields];

      if (required) {
        const isRequired = isBsdasriFieldRequired(
          required,
          bsdasri,
          signaturesToCheck,
          validationContext.currentSignatureType
        );

        if (isRequired) {
          checkFieldIsDefined({
            resource: bsdasri,
            field: bsdasriField,
            rule: required,
            path,
            readableFieldName,
            ctx: zodContext
          });
        }
      }
    }
  };
};
