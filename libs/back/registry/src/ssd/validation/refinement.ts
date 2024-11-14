import { Refinement, z } from "zod";

import { refineActorOrgId } from "../../shared/refinement";
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

export const refineDestinationOrgId = refineActorOrgId<ParsedZodSsdItem>({
  typeKey: "destinationType",
  orgIdKey: "destinationOrgId",
  countryKey: "destinationCountryCode"
});

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
