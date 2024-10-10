import { Refinement, RefinementCtx, z } from "zod";
import { BsvhuValidationContext } from "./types";
import { ParsedZodBsvhu, ZodBsvhu } from "./schema";
import {
  bsvhuEditionRules,
  BsvhuEditableFields,
  isBsvhuFieldRequired,
  EditionRulePath
} from "./rules";
import { getSignatureAncestors } from "./helpers";
import { isArray } from "../../common/dataTypes";
import { capitalize } from "../../common/strings";
import { BsdType, WasteAcceptationStatus } from "@prisma/client";
import {
  destinationOperationModeRefinement,
  isBrokerRefinement,
  isDestinationRefinement,
  isEcoOrganismeRefinement,
  isEmitterNotDormantRefinement,
  isRegisteredVatNumberRefinement,
  isTraderRefinement,
  isTransporterRefinement
} from "../../common/validation/zod/refinement";
import { EditionRule } from "./rules";
import { CompanyRole } from "../../common/validation/zod/schema";

// Date de la MAJ 2024.07.2 introduisant un changement
// des règles de validations sur les poids et volume qui doivent
// désormais être strictement > 0
const v2024072 = new Date("2024-07-30");

/**
 * Ce refinement permet de vérifier que les établissements présents sur le
 * BSVHU sont bien inscrits sur Trackdéchets avec le bon profil
 */
export const checkCompanies: Refinement<ParsedZodBsvhu> = async (
  bsvhu,
  zodContext
) => {
  await isEmitterNotDormantRefinement(bsvhu.emitterCompanySiret, zodContext);
  await isDestinationRefinement(
    bsvhu.destinationCompanySiret,
    zodContext,
    bsvhu.destinationType ?? "WASTE_VEHICLES"
  );
  await isDestinationRefinement(
    bsvhu.destinationOperationNextDestinationCompanySiret,
    zodContext,
    "BROYEUR",
    CompanyRole.DestinationOperationNextDestination
  );
  await isTransporterRefinement(
    {
      siret: bsvhu.transporterCompanySiret,
      transporterRecepisseIsExempted:
        bsvhu.transporterRecepisseIsExempted ?? false
    },
    zodContext
  );
  await isRegisteredVatNumberRefinement(
    bsvhu.transporterCompanyVatNumber,
    zodContext
  );
  await isEcoOrganismeRefinement(
    bsvhu.ecoOrganismeSiret,
    BsdType.BSVHU,
    zodContext
  );
  await isBrokerRefinement(bsvhu.brokerCompanySiret, zodContext);
  await isTraderRefinement(bsvhu.traderCompanySiret, zodContext);
};

export const checkWeights: Refinement<ParsedZodBsvhu> = (
  bsvhu,
  { addIssue }
) => {
  if (
    bsvhu.weightValue === 0 &&
    bsvhu.createdAt &&
    bsvhu.createdAt.getTime() - v2024072.getTime() > 0
  ) {
    // Changement de règle de validation dans la MAJ 2024.07.2. Il était possible
    // avant de passer un poids égal à 0. On restreint désormais aux valeurs strictement
    // positives mais uniquement pour les nouveaux bordereaux crées afin d'éviter des
    // erreurs de validation sur des BSVHUs qui ont déjà été publiés en l'état.
    // On pourra à terme passer de .nonnegative à .positive directement dans le schéma zod.}
    addIssue({
      code: z.ZodIssueCode.custom,
      path: ["weight", "value"],
      message: "Le poids doit être supérieur à 0"
    });
  }
};

export const checkOperationMode: Refinement<ParsedZodBsvhu> = (
  bsvhu,
  zodContext
) => {
  destinationOperationModeRefinement(
    bsvhu.destinationOperationCode,
    bsvhu.destinationOperationMode,
    zodContext
  );
};

export const checkReceptionWeight: Refinement<ParsedZodBsvhu> = (
  bsvhu,
  { addIssue }
) => {
  if (bsvhu.destinationReceptionAcceptationStatus) {
    if (
      bsvhu.destinationReceptionAcceptationStatus ===
        WasteAcceptationStatus.REFUSED &&
      bsvhu.destinationReceptionWeight !== 0
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination", "reception", "weight"],
        message:
          "destinationReceptionWeight : le poids doit être égal à 0 lorsque le déchet est refusé"
      });
    } else if (
      [
        WasteAcceptationStatus.ACCEPTED,
        WasteAcceptationStatus.PARTIALLY_REFUSED
      ].includes(bsvhu.destinationReceptionAcceptationStatus) &&
      (!bsvhu.destinationReceptionWeight ||
        bsvhu.destinationReceptionWeight <= 0)
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination", "reception", "weight"],
        message:
          "destinationReceptionWeight : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
      });
    }
  }
};

export const checkEmitterSituation: Refinement<ParsedZodBsvhu> = (
  bsvhu,
  { addIssue }
) => {
  if (bsvhu.emitterNoSiret && !bsvhu.emitterIrregularSituation) {
    // Le seul cas où l'émetteur peut ne pas avoir de SIRET est si il est en situation irrégulière
    addIssue({
      code: z.ZodIssueCode.custom,
      path: ["emitter", "irregularSituation"],
      message:
        "emitterIrregularSituation : L'émetteur doit obligatoirement avoir un numéro de SIRET si il n'est pas en situation irrégulière"
    });
  }
};

type CheckFieldIsDefinedArgs<T extends ZodBsvhu> = {
  resource: T;
  field: string;
  rule: EditionRule<T>;
  readableFieldName?: string;
  path?: EditionRulePath;
  ctx: RefinementCtx;
  errorMsg?: (fieldDescription: string) => string;
};

function checkFieldIsDefined<T extends ZodBsvhu>(
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
  validationContext: BsvhuValidationContext
) => Refinement<ParsedZodBsvhu> = validationContext => {
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );

  return (bsvhu, zodContext) => {
    for (const bsvhuField of Object.keys(bsvhuEditionRules)) {
      const { required, readableFieldName, path } =
        bsvhuEditionRules[bsvhuField as keyof BsvhuEditableFields];

      if (required) {
        const isRequired = isBsvhuFieldRequired(
          required,
          bsvhu,
          signaturesToCheck
        );
        if (isRequired) {
          checkFieldIsDefined({
            resource: bsvhu,
            field: bsvhuField,
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
