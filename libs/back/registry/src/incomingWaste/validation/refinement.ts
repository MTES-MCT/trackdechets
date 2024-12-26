import { Refinement, z } from "zod";
import { ParsedZodIncomingWasteItem } from "./schema";
import { getCachedCompany } from "../../shared/helpers";
import { $Enums } from "@prisma/client";
import { refineActorOrgId } from "../../shared/refinement";

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

export const initialEmitterRefinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "initialEmitterCompanyType",
    orgIdKey: "initialEmitterCompanyOrgId"
  });

export const emitterRefinement = refineActorOrgId<ParsedZodIncomingWasteItem>({
  typeKey: "emitterCompanyType",
  orgIdKey: "emitterCompanyOrgId"
});

export const transporter1Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter1CompanyType",
    orgIdKey: "transporter1CompanyOrgId"
  });

export const transporter2Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter2CompanyType",
    orgIdKey: "transporter2CompanyOrgId"
  });

export const transporter3Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter3CompanyType",
    orgIdKey: "transporter3CompanyOrgId"
  });

export const transporter4Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter4CompanyType",
    orgIdKey: "transporter4CompanyOrgId"
  });

export const transporter5Refinement =
  refineActorOrgId<ParsedZodIncomingWasteItem>({
    typeKey: "transporter5CompanyType",
    orgIdKey: "transporter5CompanyOrgId"
  });
