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
