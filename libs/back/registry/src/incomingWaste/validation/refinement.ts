import { Refinement, z } from "zod";
import { ParsedZodIncomingWasteItem } from "./schema";
import { getCachedCompany } from "../../shared/helpers";
import { $Enums } from "@prisma/client";
import {
  refineActorInfos,
  refineTransporterInfos
} from "../../shared/refinement";

export const refineWeighingHour: Refinement<
  ParsedZodIncomingWasteItem
> = async (incomingWasteItem, { addIssue }) => {
  const company = await getCachedCompany(
    incomingWasteItem.reportForCompanySiret
  );

  const isIncineration = company?.wasteProcessorTypes.some(
    type =>
      type === $Enums.WasteProcessorType.DANGEROUS_WASTES_INCINERATION ||
      type === $Enums.WasteProcessorType.NON_DANGEROUS_WASTES_INCINERATION
  );

  const isWastesStorage = company?.wasteProcessorTypes.some(
    type =>
      type === $Enums.WasteProcessorType.DANGEROUS_WASTES_STORAGE ||
      type === $Enums.WasteProcessorType.NON_DANGEROUS_WASTES_STORAGE
  );

  const isMandatory =
    (isIncineration &&
      ["R 1", "D 10"].includes(incomingWasteItem.operationCode)) ||
    (isWastesStorage && incomingWasteItem.operationCode === "D 5");

  if (isMandatory && !incomingWasteItem.weighingHour) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'heure de pesée est obligatoire`,
      path: ["weighingHour"]
    });
  }
};

export const initialEmitterRefinement: Refinement<ParsedZodIncomingWasteItem> =
  refineActorInfos<ParsedZodIncomingWasteItem>({
    typeKey: "initialEmitterCompanyType",
    orgIdKey: "initialEmitterCompanyOrgId",
    nameKey: "initialEmitterCompanyName",
    addressKey: "initialEmitterCompanyAddress",
    postalCodeKey: "initialEmitterCompanyPostalCode",
    cityKey: "initialEmitterCompanyCity",
    countryKey: "initialEmitterCompanyCountryCode"
  });

export const emitterRefinement = refineActorInfos<ParsedZodIncomingWasteItem>({
  typeKey: "emitterCompanyType",
  orgIdKey: "emitterCompanyOrgId",
  nameKey: "emitterCompanyName",
  addressKey: "emitterCompanyAddress",
  postalCodeKey: "emitterCompanyPostalCode",
  cityKey: "emitterCompanyCity",
  countryKey: "emitterCompanyCountryCode"
});

export const transporter1Refinement =
  refineTransporterInfos<ParsedZodIncomingWasteItem>({
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
  refineTransporterInfos<ParsedZodIncomingWasteItem>({
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
  refineTransporterInfos<ParsedZodIncomingWasteItem>({
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
  refineTransporterInfos<ParsedZodIncomingWasteItem>({
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
  refineTransporterInfos<ParsedZodIncomingWasteItem>({
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

export const refineReportForProfile: Refinement<
  ParsedZodIncomingWasteItem
> = async (incomingWasteItem, { addIssue }) => {
  const company = await getCachedCompany(
    incomingWasteItem.reportForCompanySiret
  );
  if (!company) {
    return;
  }

  const allowedProfiles: $Enums.CompanyType[] = [
    $Enums.CompanyType.WASTEPROCESSOR,
    $Enums.CompanyType.WASTE_VEHICLES,
    $Enums.CompanyType.COLLECTOR,
    $Enums.CompanyType.WASTE_CENTER
  ];
  if (!company.companyTypes.some(type => allowedProfiles.includes(type))) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'établissement doit avoir le profil TTR et/ou Installation de traitement et/ou Installation de traitement VHU et/ou Déchetterie pour émettre une déclaration`,
      path: ["reportForCompanySiret"]
    });
  }
};
