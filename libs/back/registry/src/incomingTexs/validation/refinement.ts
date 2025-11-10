import { Refinement, z } from "zod";
import {
  refineActorInfos,
  refineTransporterInfos
} from "../../shared/refinement";
import { ParsedZodIncomingTexsItem } from "./schema";
import { $Enums } from "@td/prisma";
import { getCachedCompany } from "../../shared/helpers";

export const initialEmitterRefinement: Refinement<ParsedZodIncomingTexsItem> =
  refineActorInfos<ParsedZodIncomingTexsItem>({
    typeKey: "initialEmitterCompanyType",
    orgIdKey: "initialEmitterCompanyOrgId",
    nameKey: "initialEmitterCompanyName",
    addressKey: "initialEmitterCompanyAddress",
    postalCodeKey: "initialEmitterCompanyPostalCode",
    cityKey: "initialEmitterCompanyCity",
    countryKey: "initialEmitterCompanyCountryCode"
  });

export const emitterRefinement = refineActorInfos<ParsedZodIncomingTexsItem>({
  typeKey: "emitterCompanyType",
  orgIdKey: "emitterCompanyOrgId",
  nameKey: "emitterCompanyName",
  addressKey: "emitterCompanyAddress",
  postalCodeKey: "emitterCompanyPostalCode",
  cityKey: "emitterCompanyCity",
  countryKey: "emitterCompanyCountryCode"
});

export const transporter1Refinement =
  refineTransporterInfos<ParsedZodIncomingTexsItem>({
    modeKey: "transporter1TransportMode",
    typeKey: "transporter1CompanyType",
    orgIdKey: "transporter1CompanyOrgId",
    nameKey: "transporter1CompanyName",
    addressKey: "transporter1CompanyAddress",
    postalCodeKey: "transporter1CompanyPostalCode",
    cityKey: "transporter1CompanyCity",
    countryKey: "transporter1CompanyCountryCode",
    recepisseIsExemptedKey: "transporter1RecepisseIsExempted",
    recepisseNumberKey: "transporter1RecepisseNumber",
    ttdImportNumberKey: "ttdImportNumber"
  });

export const transporter2Refinement =
  refineTransporterInfos<ParsedZodIncomingTexsItem>({
    modeKey: "transporter2TransportMode",
    typeKey: "transporter2CompanyType",
    orgIdKey: "transporter2CompanyOrgId",
    nameKey: "transporter2CompanyName",
    addressKey: "transporter2CompanyAddress",
    postalCodeKey: "transporter2CompanyPostalCode",
    cityKey: "transporter2CompanyCity",
    countryKey: "transporter2CompanyCountryCode",
    recepisseIsExemptedKey: "transporter2RecepisseIsExempted",
    recepisseNumberKey: "transporter2RecepisseNumber",
    ttdImportNumberKey: "ttdImportNumber"
  });

export const transporter3Refinement =
  refineTransporterInfos<ParsedZodIncomingTexsItem>({
    modeKey: "transporter3TransportMode",
    typeKey: "transporter3CompanyType",
    orgIdKey: "transporter3CompanyOrgId",
    nameKey: "transporter3CompanyName",
    addressKey: "transporter3CompanyAddress",
    postalCodeKey: "transporter3CompanyPostalCode",
    cityKey: "transporter3CompanyCity",
    countryKey: "transporter3CompanyCountryCode",
    recepisseIsExemptedKey: "transporter3RecepisseIsExempted",
    recepisseNumberKey: "transporter3RecepisseNumber",
    ttdImportNumberKey: "ttdImportNumber"
  });

export const transporter4Refinement =
  refineTransporterInfos<ParsedZodIncomingTexsItem>({
    modeKey: "transporter4TransportMode",
    typeKey: "transporter4CompanyType",
    orgIdKey: "transporter4CompanyOrgId",
    nameKey: "transporter4CompanyName",
    addressKey: "transporter4CompanyAddress",
    postalCodeKey: "transporter4CompanyPostalCode",
    cityKey: "transporter4CompanyCity",
    countryKey: "transporter4CompanyCountryCode",
    recepisseIsExemptedKey: "transporter4RecepisseIsExempted",
    recepisseNumberKey: "transporter4RecepisseNumber",
    ttdImportNumberKey: "ttdImportNumber"
  });

export const transporter5Refinement =
  refineTransporterInfos<ParsedZodIncomingTexsItem>({
    modeKey: "transporter5TransportMode",
    typeKey: "transporter5CompanyType",
    orgIdKey: "transporter5CompanyOrgId",
    nameKey: "transporter5CompanyName",
    addressKey: "transporter5CompanyAddress",
    postalCodeKey: "transporter5CompanyPostalCode",
    cityKey: "transporter5CompanyCity",
    countryKey: "transporter5CompanyCountryCode",
    recepisseIsExemptedKey: "transporter5RecepisseIsExempted",
    recepisseNumberKey: "transporter5RecepisseNumber",
    ttdImportNumberKey: "ttdImportNumber"
  });

export const refineReportForProfile: Refinement<
  ParsedZodIncomingTexsItem
> = async (incomingTexsItem, { addIssue }) => {
  const company = await getCachedCompany(
    incomingTexsItem.reportForCompanySiret
  );
  if (!company) {
    return;
  }

  const allowedProfiles: $Enums.CompanyType[] = [
    $Enums.CompanyType.WASTEPROCESSOR,
    $Enums.CompanyType.COLLECTOR,
    $Enums.CompanyType.DISPOSAL_FACILITY
  ];
  if (!company.companyTypes.some(type => allowedProfiles.includes(type))) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'établissement doit avoir le profil TTR et/ou Installation de traitement et/ou Installation de valorisation de terres et sédiments pour émettre une déclaration`,
      path: ["reportForCompanySiret"]
    });
  }
};
