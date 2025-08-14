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
import { BsdType, WasteAcceptationStatus, BsdasriType } from "@prisma/client";
import {
  destinationOperationModeRefinement,
  isDestinationRefinement,
  isEcoOrganismeRefinement,
  isEmitterRefinement,
  isRegisteredVatNumberRefinement,
  isTransporterRefinement,
  isTraderRefinement,
  isBrokerRefinement
} from "../../common/validation/zod/refinement";
import { isDefined } from "../../common/helpers";

import { DASRI_GROUPING_OPERATIONS_CODES } from "@td/constants";
import { prisma } from "@td/prisma";
import { isCollector, isWasteCenter } from "../../companies/validation";

export const validateDestinationOperationCode: (
  validationContext: BsdasriValidationContext
) => Refinement<ParsedZodBsdasri> = () => {
  return async (bsdasri, { addIssue }) => {
    const { destinationOperationCode, grouping } = bsdasri;

    if (grouping && grouping.length) {
      if (
        DASRI_GROUPING_OPERATIONS_CODES.includes(destinationOperationCode ?? "")
      ) {
        addIssue({
          code: z.ZodIssueCode.custom,
          fatal: true,
          path: ["destination", "operation", "code"],
          message:
            "Cette opération d’élimination / valorisation n'existe pas ou n'est pas appropriée"
        });
      }
    }

    if (
      bsdasri.type === BsdasriType.SYNTHESIS &&
      DASRI_GROUPING_OPERATIONS_CODES.includes(destinationOperationCode ?? "")
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        fatal: true,

        message:
          "Les codes R12 et D13 sont interdits sur un bordereau de synthèse"
      });
    }
  };
};

export const forbidSynthesisTraderBrokerIntermediaries: () => Refinement<ParsedZodBsdasri> =
  () => {
    return async (bsdasri, { addIssue }) => {
      const { intermediaries, synthesizing } = bsdasri;

      if (bsdasri.type !== BsdasriType.SYNTHESIS && !synthesizing?.length) {
        return;
      }

      if (bsdasri.traderCompanySiret) {
        addIssue({
          code: z.ZodIssueCode.custom,
          fatal: true,
          path: ["trader", "company", "siret"],
          message: "Le dasri de synthèse n'admet pas de courtier"
        });
      }
      if (bsdasri.brokerCompanySiret) {
        addIssue({
          code: z.ZodIssueCode.custom,
          fatal: true,
          path: ["broker", "company", "siret"],
          message: "Le dasri de synthèse n'admet pas de négociant"
        });
      }

      if (intermediaries?.length) {
        addIssue({
          code: z.ZodIssueCode.custom,
          fatal: true,
          path: ["intermediaries"],
          message: "Le dasri de synthèse n'admet pas d'intermédiaires"
        });
      }
    };
  };

export const validateRecipientIsCollectorForGroupingCodes: (
  validationContext: BsdasriValidationContext
) => Refinement<ParsedZodBsdasri> = () => {
  return async (bsdasri, { addIssue }) => {
    const { destinationCompanySiret, destinationOperationCode } = bsdasri;

    if (
      destinationOperationCode &&
      DASRI_GROUPING_OPERATIONS_CODES.includes(destinationOperationCode) &&
      destinationCompanySiret
    ) {
      const destinationCompany = await prisma.company.findUnique({
        where: {
          siret: destinationCompanySiret
        }
      });

      if (
        !destinationCompany ||
        (!isCollector(destinationCompany) && !isWasteCenter(destinationCompany))
      ) {
        addIssue({
          code: z.ZodIssueCode.custom,
          fatal: true,
          path: ["destination", "operation", "code"],
          message:
            "Les codes R12 et D13 sont réservés aux installations de tri transit regroupement ou installations de collecte (Rubrique 2710)"
        });
      }
    }
  };
};

export const validateSynthesisTransporterAcceptation: (
  validationContext: BsdasriValidationContext
) => Refinement<ParsedZodBsdasri> = validationContext => {
  return async (bsdasri, { addIssue }) => {
    if (bsdasri.type !== BsdasriType.SYNTHESIS) {
      return;
    }
    const currentSignatureType = validationContext.currentSignatureType;

    if (currentSignatureType !== "TRANSPORT") {
      return;
    }

    if (
      bsdasri.transporterAcceptationStatus !==
        WasteAcceptationStatus.ACCEPTED ||
      !bsdasri.transporterAcceptationStatus
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        fatal: true,

        message:
          "Un dasri de synthèse ne peut pas être refusé ou partiellement accepté par le transporteur."
      });
    }
  };
};

export const validateSynthesisDestinationAcceptation: (
  validationContext: BsdasriValidationContext
) => Refinement<ParsedZodBsdasri> = validationContext => {
  const currentSignatureType = validationContext.currentSignatureType;
  return async (bsdasri, { addIssue }) => {
    if (bsdasri.type !== BsdasriType.SYNTHESIS) {
      return;
    }
    if (currentSignatureType !== "RECEPTION") {
      return;
    }
    if (
      bsdasri.destinationReceptionAcceptationStatus !==
        WasteAcceptationStatus.ACCEPTED ||
      !bsdasri.destinationReceptionAcceptationStatus
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        fatal: true,

        message:
          "Un dasri de synthèse ne peut pas être refusé ou partiellement accepté par le destinataire."
      });
    }
  };
};

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

  await isBrokerRefinement(bsdasri.brokerCompanySiret, zodContext);
  await isTraderRefinement(bsdasri.traderCompanySiret, zodContext);
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

export const validateCap: Refinement<ParsedZodBsdasri> = (
  bsdasri,
  { addIssue }
) => {
  // No destination CAP for synthesis DASRI
  if (bsdasri.synthesizing?.length && isDefined(bsdasri.destinationCap)) {
    addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destinationCap"],
      message:
        "Vous ne pouvez pas renseigner le CAP de la destination sur les DASRI de synthèse."
    });
  }
};
