import { Refinement, z } from "zod";
import { ParsedZodTransportedItem } from "./schema";
import { refineActorInfos } from "../../shared/refinement";

export const refineDates: Refinement<ParsedZodTransportedItem> = (
  transportedItem,
  { addIssue }
) => {
  if (transportedItem.unloadingDate < transportedItem.collectionDate) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez saisir une date de déchargement antérieure à la date d'enlèvement",
      path: ["unloadingDate"]
    });
  }
};

export const refineEmitter = refineActorInfos<ParsedZodTransportedItem>({
  typeKey: "emitterCompanyType",
  orgIdKey: "emitterCompanyOrgId",
  nameKey: "emitterCompanyName",
  addressKey: "emitterCompanyAddress",
  postalCodeKey: "emitterCompanyPostalCode",
  cityKey: "emitterCompanyCity",
  countryKey: "emitterCompanyCountryCode"
});

export const refineDestination = refineActorInfos<ParsedZodTransportedItem>({
  typeKey: "destinationCompanyType",
  orgIdKey: "destinationCompanyOrgId",
  nameKey: "destinationCompanyName",
  addressKey: "destinationCompanyAddress",
  postalCodeKey: "destinationCompanyPostalCode",
  cityKey: "destinationCompanyCity",
  countryKey: "destinationCompanyCountryCode"
});

export const refineGistridNumber: Refinement<ParsedZodTransportedItem> = (
  managedItem,
  { addIssue }
) => {
  const isDangerous =
    managedItem.wasteIsDangerous ||
    managedItem.wastePop ||
    managedItem.wasteCode?.includes("*");

  const isAbroad = ["ENTREPRISE_HORS_UE", "ENTREPRISE_UE"].includes(
    managedItem.destinationCompanyType
  );

  if (!managedItem.gistridNumber && isDangerous && isAbroad) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le numéro de notification ou de déclaration est obligatoire lorsque le déchet est dangereux et que la destination ultérieure est à l'étranger`,
      path: ["gistrifNumber"]
    });
  }
};

export const refineWasteCode = (
  managedItem: ParsedZodTransportedItem,
  { addIssue }: { addIssue: (issue: z.ZodIssue) => void }
) => {
  if (managedItem.reportForTransportIsWaste && !managedItem.wasteCode) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le code déchet est obligatoire lorsqu'un déchet est transporté",
      path: ["wasteCode"]
    });
  }
};

export const refinePlates = (
  managedItem: ParsedZodTransportedItem,
  { addIssue }: { addIssue: (issue: z.ZodIssue) => void }
) => {
  if (
    managedItem.reportForTransportMode === "ROAD" &&
    (!managedItem.reportForTransportPlates ||
      managedItem.reportForTransportPlates.length === 0)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Les plaques d'immatriculation sont obligatoires lorsque le mode de transport est par route",
      path: ["reportForTransportPlates"]
    });
  }
};
