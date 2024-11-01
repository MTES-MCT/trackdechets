import { isSiret, countries as vatCountries } from "@td/constants";
import { checkVAT } from "jsvat";
import { Refinement, z } from "zod";

import { ParsedZodSsdItem } from "./schema";

export const refineDates: Refinement<ParsedZodSsdItem> = (
  ssdItem,
  { addIssue }
) => {
  if (ssdItem.useDate && ssdItem.dispatchDate) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Impossible de saisir à la fois une date d'utilisation et une date d'expédition.",
      path: ["useDate"]
    });
  }

  if (ssdItem.useDate && ssdItem.useDate < ssdItem.processingDate) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La date d'utilisation ne peut pas être antérieure à la date de traitement.",
      path: ["useDate"]
    });
  }

  if (ssdItem.dispatchDate && ssdItem.dispatchDate < ssdItem.processingDate) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La date d'expédition ne peut pas être antérieure à la date de traitement.",
      path: ["dispatchDate"]
    });
  }

  if (
    ssdItem.processingEndDate &&
    ssdItem.processingEndDate < ssdItem.processingDate
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La date de fin de traitement ne peut pas être antérieure à la date de traitement.",
      path: ["processingEndDate"]
    });
  }

  if (
    ssdItem.processingEndDate &&
    ssdItem.useDate &&
    ssdItem.useDate < ssdItem.processingDate
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La date de fin de traitement ne peut pas être postérieure à la date d'utilisation.",
      path: ["processingEndDate"]
    });
  }

  if (
    ssdItem.processingEndDate &&
    ssdItem.dispatchDate &&
    ssdItem.dispatchDate < ssdItem.processingDate
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La date de fin de traitement ne peut pas être postérieure à la date d'expédition.",
      path: ["processingEndDate"]
    });
  }
};

export const refineDestinationOrgId: Refinement<ParsedZodSsdItem> = (
  ssdItem,
  { addIssue }
) => {
  switch (ssdItem.destinationType) {
    case "ENTREPRISE_FR": {
      if (!isSiret(ssdItem.destinationOrgId)) {
        addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le SIRET du destinataire n'est pas un SIRET valide.",
          path: ["destinationOrgId"]
        });
      }
      break;
    }
    case "ENTREPRISE_UE": {
      const { isValid } = checkVAT(ssdItem.destinationOrgId, vatCountries);
      if (!isValid) {
        addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le numéro d'identification du destinataire doit faire entre 3 et 27 caractères pour une entreprise Européenne. Il commence par 2 lettres majuscules et est suivi de chiffres.",
          path: ["destinationOrgId"]
        });
      }
      break;
    }
    case "ENTREPRISE_HORS_UE": {
      const isOrgIdValidOutOfUe =
        ssdItem.destinationOrgId &&
        /[A-Z0-9]{1,25}/.test(ssdItem.destinationOrgId);
      if (!isOrgIdValidOutOfUe) {
        addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le numéro d'identification du destinataire doit faire entre 1 et 25 caractères pour une entreprise hors UE. Il est composé de lettres majuscules et de chiffres.",
          path: ["destinationOrgId"]
        });
      }
      break;
    }
    case "ASSOCIATION": {
      const isOrgIdValidAssociation =
        ssdItem.destinationOrgId && /W[0-9]{9}/.test(ssdItem.destinationOrgId);
      if (!isOrgIdValidAssociation) {
        addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le numéro d'identification du destinataire doit faire 10 caractères pour une assoxiation. Il commence par un W suivi de 9 chiffres.",
          path: ["destinationOrgId"]
        });
      }
      break;
    }
    default:
      throw new Error("Unhandled destination type");
  }
};

export const refineSecondaryWasteCodes: Refinement<ParsedZodSsdItem> = (
  ssdItem,
  { addIssue }
) => {
  const wasteCodesLength = ssdItem.secondaryWasteCodes?.length || 0;
  const wasteDescriptionsLength =
    ssdItem.secondaryWasteDescriptions?.length || 0;

  if (wasteCodesLength !== wasteDescriptionsLength) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le nombre de code déchets secondaites doit correspondre au nombre de descriptions secondaires. ${wasteCodesLength} code(s) et ${wasteDescriptionsLength} description(s) fournis.`,
      path: ["secondaryWasteCodes"]
    });
  }
};
