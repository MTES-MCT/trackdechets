import { Refinement, z } from "zod";

import { refineActorInfos } from "../../shared/refinement";
import { ParsedZodSsdItem } from "./schema";
import { getCachedCompany } from "../../shared/helpers";
import { $Enums } from "@prisma/client";

export const refineDates: Refinement<ParsedZodSsdItem> = (
  ssdItem,
  { addIssue }
) => {
  if (!ssdItem.useDate && !ssdItem.dispatchDate) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez saisir soit une date d'utilisation soit une date d'expédition.",
      path: ["useDate"]
    });
  }

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
};

export const refineDestination: Refinement<ParsedZodSsdItem> = (item, ctx) => {
  if (item.dispatchDate && !item.useDate && !item.destinationCompanyType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez saisir les informations de l'entreprise de destination lorsqu'une date d'expédition est renseignée",
      path: ["destinationCompanyType"]
    });
  }

  refineActorInfos<ParsedZodSsdItem>({
    typeKey: "destinationCompanyType",
    orgIdKey: "destinationCompanyOrgId",
    nameKey: "destinationCompanyName",
    addressKey: "destinationCompanyAddress",
    cityKey: "destinationCompanyCity",
    postalCodeKey: "destinationCompanyPostalCode",
    countryKey: "destinationCompanyCountryCode"
  })(item, ctx);
};

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

export const refineReportForProfile: Refinement<ParsedZodSsdItem> = async (
  ssdItem,
  { addIssue }
) => {
  const company = await getCachedCompany(ssdItem.reportForCompanySiret);
  if (!company) {
    return;
  }

  if (!company.companyTypes.includes($Enums.CompanyType.RECOVERY_FACILITY)) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'établissement doit avoir le profil "Installation dans laquelle les déchets perdent leur statut de déchet" pour émettre une déclaration SSD`,
      path: ["reportForCompanySiret"]
    });
  }
};
