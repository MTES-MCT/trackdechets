import { Refinement, z } from "zod";
import { ParsedZodTransportedItem } from "./schema";
import {
  refineActorInfos,
  refineWeightAndVolume
} from "../../shared/refinement";

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

export const refineVolumeAndWeightIfWaste: Refinement<
  ParsedZodTransportedItem
> = (transportedItem, context) => {
  const uncheckedCodes = [
    "17 05 03*",
    "17 05 04",
    "17 05 05*",
    "17 05 06",
    "20 02 02"
  ];

  const shouldCheckCode =
    !transportedItem.wasteCode ||
    !uncheckedCodes.includes(transportedItem.wasteCode);

  if (transportedItem.reportForTransportIsWaste && shouldCheckCode) {
    refineWeightAndVolume(transportedItem, context);
  }
};
