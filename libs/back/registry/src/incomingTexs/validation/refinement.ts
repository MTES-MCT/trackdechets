import { Refinement, z } from "zod";
import { refineActorInfos } from "../../shared/refinement";
import { ParsedZodIncomingTexsItem } from "./schema";
import { $Enums } from "@prisma/client";
import { getCachedCompany } from "../../shared/helpers";

export const initialEmitterRefinement: Refinement<
  ParsedZodIncomingTexsItem
> = async (incomingTexsItem, { addIssue }) => {
  if (
    !incomingTexsItem.emitterNoTraceability &&
    !incomingTexsItem.initialEmitterCompanyOrgId
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'organisme initial émetteur doit être renseigné`,
      path: ["initialEmitterCompanyOrgId"]
    });
  }

  refineActorInfos<ParsedZodIncomingTexsItem>({
    typeKey: "initialEmitterCompanyType",
    orgIdKey: "initialEmitterCompanyOrgId",
    nameKey: "initialEmitterCompanyName",
    addressKey: "initialEmitterCompanyAddress",
    postalCodeKey: "initialEmitterCompanyPostalCode",
    cityKey: "initialEmitterCompanyCity",
    countryKey: "initialEmitterCompanyCountryCode"
  });
};

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
  refineActorInfos<ParsedZodIncomingTexsItem>({
    typeKey: "transporter1CompanyType",
    orgIdKey: "transporter1CompanyOrgId",
    nameKey: "transporter1CompanyName",
    addressKey: "transporter1CompanyAddress",
    postalCodeKey: "transporter1CompanyPostalCode",
    cityKey: "transporter1CompanyCity",
    countryKey: "transporter1CompanyCountryCode"
  });

export const transporter2Refinement =
  refineActorInfos<ParsedZodIncomingTexsItem>({
    typeKey: "transporter2CompanyType",
    orgIdKey: "transporter2CompanyOrgId",
    nameKey: "transporter2CompanyName",
    addressKey: "transporter2CompanyAddress",
    postalCodeKey: "transporter2CompanyPostalCode",
    cityKey: "transporter2CompanyCity",
    countryKey: "transporter2CompanyCountryCode"
  });

export const transporter3Refinement =
  refineActorInfos<ParsedZodIncomingTexsItem>({
    typeKey: "transporter3CompanyType",
    orgIdKey: "transporter3CompanyOrgId",
    nameKey: "transporter3CompanyName",
    addressKey: "transporter3CompanyAddress",
    postalCodeKey: "transporter3CompanyPostalCode",
    cityKey: "transporter3CompanyCity",
    countryKey: "transporter3CompanyCountryCode"
  });

export const transporter4Refinement =
  refineActorInfos<ParsedZodIncomingTexsItem>({
    typeKey: "transporter4CompanyType",
    orgIdKey: "transporter4CompanyOrgId",
    nameKey: "transporter4CompanyName",
    addressKey: "transporter4CompanyAddress",
    postalCodeKey: "transporter4CompanyPostalCode",
    cityKey: "transporter4CompanyCity",
    countryKey: "transporter4CompanyCountryCode"
  });

export const transporter5Refinement =
  refineActorInfos<ParsedZodIncomingTexsItem>({
    typeKey: "transporter5CompanyType",
    orgIdKey: "transporter5CompanyOrgId",
    nameKey: "transporter5CompanyName",
    addressKey: "transporter5CompanyAddress",
    postalCodeKey: "transporter5CompanyPostalCode",
    cityKey: "transporter5CompanyCity",
    countryKey: "transporter5CompanyCountryCode"
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
