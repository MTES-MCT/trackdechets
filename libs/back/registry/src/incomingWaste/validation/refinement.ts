import { Refinement, z } from "zod";
import { ParsedZodIncomingWasteItem } from "./schema";
import { getCachedCompany } from "../../shared/helpers";
import { $Enums } from "@prisma/client";
import { refineActorOrgId } from "../../shared/refinement";

export const refineIsDangerous: Refinement<ParsedZodIncomingWasteItem> = (
  incomingWasteItem,
  { addIssue }
) => {
  // No check if the value is not set
  if (incomingWasteItem.wasteIsDangerous == null) {
    return;
  }

  if (
    (incomingWasteItem.wastePop || incomingWasteItem.wasteCode.includes("*")) &&
    !incomingWasteItem.wasteIsDangerous
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le déchet contient des POP ou a un code déchet avec étoile, il ne peut pas être indiqué comme non dangereux`,
      path: ["wasteIsDangerous"]
    });
  }
};

export const refineWeighingHour: Refinement<
  ParsedZodIncomingWasteItem
> = async (incomingWasteItem, { addIssue }) => {
  const company = await getCachedCompany(incomingWasteItem.reportForSiret);

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

export const refineWeightAndVolume: Refinement<ParsedZodIncomingWasteItem> = (
  incomingWasteItem,
  { addIssue }
) => {
  const isUsingRoad = [
    incomingWasteItem.transporter1TransportMode,
    incomingWasteItem.transporter2TransportMode,
    incomingWasteItem.transporter3TransportMode,
    incomingWasteItem.transporter4TransportMode,
    incomingWasteItem.transporter5TransportMode
  ].some(transportMode => transportMode === "ROUTE");

  if (isUsingRoad && incomingWasteItem.weightValue > 40) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le poids ne peut pas dépasser 40 tonnes lorsque le déchet est transporté par la route`,
      path: ["weightValue"]
    });
  }

  if (
    isUsingRoad &&
    incomingWasteItem.volume &&
    incomingWasteItem.volume > 40
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le volume ne peut pas dépasser 40 M3 lorsque le déchet est transporté par la route`,
      path: ["volume"]
    });
  }

  if (
    incomingWasteItem.weightIsEstimate &&
    ["R 1", "D 10", "D 5"].includes(incomingWasteItem.operationCode)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Pour les codes opération R 1, D 10 et D 5, le poids ne peut pas être estimé`,
      path: ["weightIsEstimate"]
    });
  }
};

export const refineMunicipalities: Refinement<ParsedZodIncomingWasteItem> = (
  incomingWasteItem,
  { addIssue }
) => {
  if (incomingWasteItem.producerType === "COMMUNE" && !incomingWasteItem.municipalitiesInseeCodes?.length) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le ou les codes INSEE des communes doivent être saisi`,
      path: ["municipalitiesInseeCodes"]
    });
  }

  if (incomingWasteItem.producerType === "COMMUNE" && !incomingWasteItem.municipalitiesNames?.length) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le ou les libellés des communes doivent être saisi`,
      path: ["municipalitiesNames"]
    });
  }

  if (
    incomingWasteItem.municipalitiesInseeCodes?.length !==
    incomingWasteItem.municipalitiesNames?.length
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le nombre de codes INSEE et de noms de communes doit être identique`,
      path: ["municipalitiesNames"]
    });
  }
};

export const refineNotificationNumber: Refinement<
  ParsedZodIncomingWasteItem
> = (incomingWasteItem, { addIssue }) => {
  const isDangerous =
    incomingWasteItem.wasteIsDangerous ||
    incomingWasteItem.wastePop ||
    incomingWasteItem.wasteCode.includes("*");

  if (!incomingWasteItem.notificationNumber && isDangerous) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le uméro de notification est obligatoire lorsque le déchet est dangereux`,
      path: ["notificationNumber"]
    });
  }
};

export const producerRefinement = refineActorOrgId<ParsedZodIncomingWasteItem>({
  typeKey: "producerType",
  orgIdKey: "producerOrgId"
});

export const senderRefinement = refineActorOrgId<ParsedZodIncomingWasteItem>({
  typeKey: "senderType",
  orgIdKey: "senderOrgId"
});

export const transporter1Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter1Type",
    orgIdKey: "transporter1OrgId"
  });

export const transporter2Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter2Type",
    orgIdKey: "transporter2OrgId"
  });

export const transporter3Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter3Type",
    orgIdKey: "transporter3OrgId"
  });

export const transporter4Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter4Type",
    orgIdKey: "transporter4OrgId"
  });

export const transporter5Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter5Type",
    orgIdKey: "transporter5OrgId"
  });
