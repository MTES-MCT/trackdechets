import { refineActorInfos } from "../../shared/refinement";
import { ParsedZodOutgoingWasteItem } from "./schema";

export const transporter1Refinement =
  refineActorInfos<ParsedZodOutgoingWasteItem>({
    typeKey: "transporter1CompanyType",
    orgIdKey: "transporter1CompanyOrgId",
    nameKey: "transporter1CompanyName",
    addressKey: "transporter1CompanyAddress",
    postalCodeKey: "transporter1CompanyPostalCode",
    cityKey: "transporter1CompanyCity",
    countryKey: "transporter1CompanyCountryCode"
  });

export const transporter2Refinement =
  refineActorInfos<ParsedZodOutgoingWasteItem>({
    typeKey: "transporter2CompanyType",
    orgIdKey: "transporter2CompanyOrgId",
    nameKey: "transporter2CompanyName",
    addressKey: "transporter2CompanyAddress",
    postalCodeKey: "transporter2CompanyPostalCode",
    cityKey: "transporter2CompanyCity",
    countryKey: "transporter2CompanyCountryCode"
  });

export const transporter3Refinement =
  refineActorInfos<ParsedZodOutgoingWasteItem>({
    typeKey: "transporter3CompanyType",
    orgIdKey: "transporter3CompanyOrgId",
    nameKey: "transporter3CompanyName",
    addressKey: "transporter3CompanyAddress",
    postalCodeKey: "transporter3CompanyPostalCode",
    cityKey: "transporter3CompanyCity",
    countryKey: "transporter3CompanyCountryCode"
  });

export const transporter4Refinement =
  refineActorInfos<ParsedZodOutgoingWasteItem>({
    typeKey: "transporter4CompanyType",
    orgIdKey: "transporter4CompanyOrgId",
    nameKey: "transporter4CompanyName",
    addressKey: "transporter4CompanyAddress",
    postalCodeKey: "transporter4CompanyPostalCode",
    cityKey: "transporter4CompanyCity",
    countryKey: "transporter4CompanyCountryCode"
  });

export const transporter5Refinement =
  refineActorInfos<ParsedZodOutgoingWasteItem>({
    typeKey: "transporter5CompanyType",
    orgIdKey: "transporter5CompanyOrgId",
    nameKey: "transporter5CompanyName",
    addressKey: "transporter5CompanyAddress",
    postalCodeKey: "transporter5CompanyPostalCode",
    cityKey: "transporter5CompanyCity",
    countryKey: "transporter5CompanyCountryCode"
  });

export const destinationRefinement =
  refineActorInfos<ParsedZodOutgoingWasteItem>({
    typeKey: "destinationCompanyType",
    orgIdKey: "destinationCompanyOrgId",
    nameKey: "destinationCompanyName",
    addressKey: "destinationCompanyAddress",
    postalCodeKey: "destinationCompanyPostalCode",
    cityKey: "destinationCompanyCity",
    countryKey: "destinationCompanyCountryCode"
  });

export const initialEmitterRefinement =
  refineActorInfos<ParsedZodOutgoingWasteItem>({
    typeKey: "initialEmitterCompanyType",
    orgIdKey: "initialEmitterCompanyOrgId",
    nameKey: "initialEmitterCompanyName",
    addressKey: "initialEmitterCompanyAddress",
    postalCodeKey: "initialEmitterCompanyPostalCode",
    cityKey: "initialEmitterCompanyCity",
    countryKey: "initialEmitterCompanyCountryCode"
  });
