import {
  refineActorInfos,
  refineTransporterInfos
} from "../../shared/refinement";
import { ParsedZodOutgoingTexsItem } from "./schema";

export const transporter1Refinement =
  refineTransporterInfos<ParsedZodOutgoingTexsItem>({
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
  refineTransporterInfos<ParsedZodOutgoingTexsItem>({
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
  refineTransporterInfos<ParsedZodOutgoingTexsItem>({
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
  refineTransporterInfos<ParsedZodOutgoingTexsItem>({
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
  refineTransporterInfos<ParsedZodOutgoingTexsItem>({
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

export const destinationRefinement =
  refineActorInfos<ParsedZodOutgoingTexsItem>({
    typeKey: "destinationCompanyType",
    orgIdKey: "destinationCompanyOrgId",
    nameKey: "destinationCompanyName",
    addressKey: "destinationCompanyAddress",
    postalCodeKey: "destinationCompanyPostalCode",
    cityKey: "destinationCompanyCity",
    countryKey: "destinationCompanyCountryCode"
  });

export const initialEmitterRefinement =
  refineActorInfos<ParsedZodOutgoingTexsItem>({
    typeKey: "initialEmitterCompanyType",
    orgIdKey: "initialEmitterCompanyOrgId",
    nameKey: "initialEmitterCompanyName",
    addressKey: "initialEmitterCompanyAddress",
    postalCodeKey: "initialEmitterCompanyPostalCode",
    cityKey: "initialEmitterCompanyCity",
    countryKey: "initialEmitterCompanyCountryCode"
  });
