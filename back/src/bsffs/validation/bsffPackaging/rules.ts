import { SealedFieldError } from "../../../common/errors";
import { getOperationModesFromOperationCode } from "../../../common/operationModes";
import { capitalize } from "../../../common/strings";
import { isFinalOperation } from "../../constants";
import { getUpdatedFields } from "../bsff/helpers";
import { getCurrentSignatureType, getSignatureAncestors } from "./helpers";
import { ZodBsffPackaging } from "./schema";
import {
  BsffPackagingSignatureType,
  BsffPackagingValidationContext
} from "./types";
import { differenceInDays } from "date-fns";

// Specs métier
// https://docs.google.com/spreadsheets/d/1Uvd04DsmTNiMr4wzpfmS2uLd84i6IzJsgXssxzy_2ns/edit#gid=0

// Liste des champs éditables sur l'objet BsffPackaging
export type BsffPackagingEditableFields = Required<
  Omit<
    ZodBsffPackaging,
    "operationSignatureDate" | "operationSignatureAuthor" | "nextPackagingId"
  >
>;

// Règle d'édition qui permet de définir à partir de quelle signature
// un champ est verrouillé / requis avec une config contenant un paramètre
// optionnel `when`
type EditionRule = {
  // Signature à partir de laquelle le champ est requis
  from: BsffPackagingSignatureType;
  // Condition supplémentaire à vérifier pour que le champ soit requis.
  when?: (bsffPackaging: ZodBsffPackaging) => boolean;
  customErrorMessage?: string;
};

export type BsffPackagingEditionRules = {
  [Key in keyof BsffPackagingEditableFields]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: EditionRule;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: EditionRule;
    readableFieldName?: string; // A custom field name for errors
  };
};

function requireNextDestination(bsffPackaging: ZodBsffPackaging) {
  if (bsffPackaging.operationCode) {
    return !isFinalOperation(
      bsffPackaging.operationCode,
      bsffPackaging.operationNoTraceability ?? false
    );
  }
  return false;
}

function isBsffPackagingFieldSield(bsffPackaging: ZodBsffPackaging) {
  if (
    !!bsffPackaging.operationSignatureDate &&
    // cas particulier : on ne permet pas de modifier un contenant qui est
    // déjà réexpédié, regroupé ou reconditionné
    !bsffPackaging.nextPackagingId &&
    // tra-15501 Le destinataire peut modifier les informations du contenant
    // (acceptation et opération) jusqu'à 60 jours après l'opération
    differenceInDays(new Date(), bsffPackaging.operationSignatureDate) <= 60
  ) {
    return false;
  }
  return true;
}

export const bsffPackagingEditionRules: BsffPackagingEditionRules = {
  numero: {
    sealed: {
      from: "OPERATION",
      when: isBsffPackagingFieldSield
    },
    required: { from: "ACCEPTATION" }
  },
  acceptationDate: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "ACCEPTATION" }
  },
  acceptationStatus: {
    sealed: { from: "ACCEPTATION" },
    required: { from: "ACCEPTATION" }
  },
  acceptationWeight: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "ACCEPTATION" }
  },
  acceptationRefusalReason: {
    sealed: { from: "ACCEPTATION" },
    required: {
      from: "ACCEPTATION",
      when: p =>
        p.acceptationStatus === "REFUSED" ||
        p.acceptationStatus === "PARTIALLY_REFUSED"
    }
  },
  acceptationWasteCode: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield }
    // ce champ n'est pas requis car il est auto-complété
    // dans la mutation signBsff
  },
  acceptationWasteDescription: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "ACCEPTATION" }
  },
  operationDate: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION" }
  },
  operationCode: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION" }
  },
  operationMode: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: {
      from: "OPERATION",
      when: bsffPackaging => {
        if (bsffPackaging.operationCode) {
          const modes = getOperationModesFromOperationCode(
            bsffPackaging.operationCode
          );
          return modes.length > 0;
        }
        return false;
      }
    }
  },
  operationDescription: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION" }
  },
  operationNoTraceability: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION" }
  },
  operationNextDestinationPlannedOperationCode: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION", when: requireNextDestination }
  },
  operationNextDestinationCap: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield }
  },
  operationNextDestinationCompanyName: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION", when: requireNextDestination }
  },
  operationNextDestinationCompanySiret: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: {
      from: "OPERATION",
      when: bsffPackaging =>
        requireNextDestination(bsffPackaging) &&
        !bsffPackaging.operationNextDestinationCompanyVatNumber
    }
  },
  operationNextDestinationCompanyVatNumber: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: {
      from: "OPERATION",
      when: bsffPackaging =>
        requireNextDestination(bsffPackaging) &&
        !bsffPackaging.operationNextDestinationCompanySiret
    }
  },
  operationNextDestinationCompanyAddress: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION", when: requireNextDestination }
  },
  operationNextDestinationCompanyContact: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION", when: requireNextDestination }
  },
  operationNextDestinationCompanyPhone: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION", when: requireNextDestination }
  },
  operationNextDestinationCompanyMail: {
    sealed: { from: "OPERATION", when: isBsffPackagingFieldSield },
    required: { from: "OPERATION", when: requireNextDestination }
  },
  acceptationSignatureAuthor: {
    sealed: { from: "ACCEPTATION" },
    required: {
      from: "OPERATION",
      customErrorMessage: `L'installation de destination n'a pas encore signé l'acceptation du contenant`
    }
  },
  acceptationSignatureDate: {
    sealed: { from: "ACCEPTATION" },
    required: {
      from: "OPERATION",
      customErrorMessage: `L'installation de destination n'a pas encore signé l'acceptation du contenant`
    }
  }
};

/**
 * Cette fonction permet de vérifier qu'un utilisateur n'est pas
 * en train d'essayer de modifier des données qui ont été verrouillée
 * par une signature
 * @param persisted BsffPackaging persisté en base
 * @param bsffPackaging BsffPackaging avec les modifications apportées par l'input
 * @param user Utilisateur qui effectue la modification
 */
export async function checkBsffPackagingSealedFields(
  persisted: ZodBsffPackaging,
  bsffPackaging: ZodBsffPackaging,
  context: BsffPackagingValidationContext
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = getUpdatedFields(persisted, bsffPackaging);

  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(persisted);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  for (const field of updatedFields) {
    const { readableFieldName, sealed: sealedRule } =
      bsffPackagingEditionRules[field as keyof BsffPackagingEditableFields];

    const fieldDescription = readableFieldName
      ? capitalize(readableFieldName)
      : `Le champ ${field}`;

    const isSealed =
      sealedRule.from &&
      (!sealedRule.when || sealedRule.when(bsffPackaging)) &&
      signaturesToCheck.includes(sealedRule.from);

    if (isSealed) {
      sealedFieldErrors.push(
        [
          `${fieldDescription} a été verrouillé via signature et ne peut pas être modifié.`,
          sealedRule.customErrorMessage
        ]
          .filter(Boolean)
          .join(" ")
      );
    }
  }

  if (sealedFieldErrors?.length > 0) {
    throw new SealedFieldError([...new Set(sealedFieldErrors)]);
  }

  return Promise.resolve(updatedFields);
}
