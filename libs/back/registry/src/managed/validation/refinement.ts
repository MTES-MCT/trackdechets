import { Refinement, z } from "zod";
import { ParsedZodManagedItem } from "./schema";
import {
  refineActorInfos,
  refineTransporterInfos
} from "../../shared/refinement";

export const refineDates: Refinement<ParsedZodManagedItem> = (
  managedItem,
  { addIssue }
) => {
  if (managedItem.managingEndDate < managedItem.managingStartDate) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez saisir une date de fin de gestion antérieure à la date de début de gestion",
      path: ["managingEndDate"]
    });
  }
};

export const refineGistridNumber: Refinement<ParsedZodManagedItem> = (
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
      path: ["gistridNumber"]
    });
  }
};

export const refineManagedUpcycled: Refinement<ParsedZodManagedItem> = (
  managedItem,
  { addIssue }
) => {
  if (
    managedItem.isUpcycled &&
    !managedItem.destinationParcelCoordinates.length &&
    !managedItem.destinationParcelNumbers.length
  ) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner soit les numéros de parcelles de destination, soit les coordonnées de parcelles de destination lorsque les terres sont valorisées",
      path: ["destinationParcelCoordinates"]
    });
  }
};

export const refineInitialEmitter = refineActorInfos<ParsedZodManagedItem>({
  typeKey: "initialEmitterCompanyType",
  orgIdKey: "initialEmitterCompanyOrgId",
  nameKey: "initialEmitterCompanyName",
  addressKey: "initialEmitterCompanyAddress",
  postalCodeKey: "initialEmitterCompanyPostalCode",
  cityKey: "initialEmitterCompanyCity",
  countryKey: "initialEmitterCompanyCountryCode"
});

export const refineDestination = refineActorInfos<ParsedZodManagedItem>({
  typeKey: "destinationCompanyType",
  orgIdKey: "destinationCompanyOrgId",
  nameKey: "destinationCompanyName",
  addressKey: "destinationCompanyAddress",
  postalCodeKey: "destinationCompanyPostalCode",
  cityKey: "destinationCompanyCity",
  countryKey: "destinationCompanyCountryCode"
});

export const refineEmitter = refineActorInfos<ParsedZodManagedItem>({
  typeKey: "emitterCompanyType",
  orgIdKey: "emitterCompanyOrgId",
  nameKey: "emitterCompanyName",
  addressKey: "emitterCompanyAddress",
  postalCodeKey: "emitterCompanyPostalCode",
  cityKey: "emitterCompanyCity",
  countryKey: "emitterCompanyCountryCode"
});

export const refineTempStorer = refineActorInfos<ParsedZodManagedItem>({
  typeKey: "tempStorerCompanyType",
  orgIdKey: "tempStorerCompanyOrgId",
  nameKey: "tempStorerCompanyName",
  addressKey: "tempStorerCompanyAddress",
  postalCodeKey: "tempStorerCompanyPostalCode",
  cityKey: "tempStorerCompanyCity",
  countryKey: "tempStorerCompanyCountryCode"
});

export const transporter1Refinement =
  refineTransporterInfos<ParsedZodManagedItem>({
    modeKey: "transporter1TransportMode",
    typeKey: "transporter1CompanyType",
    orgIdKey: "transporter1CompanyOrgId",
    nameKey: "transporter1CompanyName",
    addressKey: "transporter1CompanyAddress",
    postalCodeKey: "transporter1CompanyPostalCode",
    cityKey: "transporter1CompanyCity",
    countryKey: "transporter1CompanyCountryCode",
    recepisseIsExemptedKey: "transporter1RecepisseIsExempted",
    recepisseNumberKey: "transporter1RecepisseNumber"
  });

export const transporter2Refinement =
  refineTransporterInfos<ParsedZodManagedItem>({
    modeKey: "transporter2TransportMode",
    typeKey: "transporter2CompanyType",
    orgIdKey: "transporter2CompanyOrgId",
    nameKey: "transporter2CompanyName",
    addressKey: "transporter2CompanyAddress",
    postalCodeKey: "transporter2CompanyPostalCode",
    cityKey: "transporter2CompanyCity",
    countryKey: "transporter2CompanyCountryCode",
    recepisseIsExemptedKey: "transporter2RecepisseIsExempted",
    recepisseNumberKey: "transporter2RecepisseNumber"
  });

export const transporter3Refinement =
  refineTransporterInfos<ParsedZodManagedItem>({
    modeKey: "transporter3TransportMode",
    typeKey: "transporter3CompanyType",
    orgIdKey: "transporter3CompanyOrgId",
    nameKey: "transporter3CompanyName",
    addressKey: "transporter3CompanyAddress",
    postalCodeKey: "transporter3CompanyPostalCode",
    cityKey: "transporter3CompanyCity",
    countryKey: "transporter3CompanyCountryCode",
    recepisseIsExemptedKey: "transporter3RecepisseIsExempted",
    recepisseNumberKey: "transporter3RecepisseNumber"
  });

export const transporter4Refinement =
  refineTransporterInfos<ParsedZodManagedItem>({
    modeKey: "transporter4TransportMode",
    typeKey: "transporter4CompanyType",
    orgIdKey: "transporter4CompanyOrgId",
    nameKey: "transporter4CompanyName",
    addressKey: "transporter4CompanyAddress",
    postalCodeKey: "transporter4CompanyPostalCode",
    cityKey: "transporter4CompanyCity",
    countryKey: "transporter4CompanyCountryCode",
    recepisseIsExemptedKey: "transporter4RecepisseIsExempted",
    recepisseNumberKey: "transporter4RecepisseNumber"
  });

export const transporter5Refinement =
  refineTransporterInfos<ParsedZodManagedItem>({
    modeKey: "transporter5TransportMode",
    typeKey: "transporter5CompanyType",
    orgIdKey: "transporter5CompanyOrgId",
    nameKey: "transporter5CompanyName",
    addressKey: "transporter5CompanyAddress",
    postalCodeKey: "transporter5CompanyPostalCode",
    cityKey: "transporter5CompanyCity",
    countryKey: "transporter5CompanyCountryCode",
    recepisseIsExemptedKey: "transporter5RecepisseIsExempted",
    recepisseNumberKey: "transporter5RecepisseNumber"
  });
