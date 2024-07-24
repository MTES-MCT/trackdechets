import { z } from "zod";
import {
  foreignVatNumberSchema,
  siretSchema
} from "../../common/validation/zod/schema";
import {
  CollectorType,
  CompanyType,
  WasteProcessorType,
  WasteVehiclesType
} from "@prisma/client";
import { setCompanyOrgId } from "./transformers";
import {
  checkEcoOrganisme,
  checkForeignTransporter,
  checkRecepisses,
  checkSubTypes
} from "./refinements";

function toSet(arr: any[]) {
  return arr ? [...new Set(arr)] : arr;
}

const rawCompanySchema = z.object({
  id: z.string().nullish(),
  siret: siretSchema.nullish(),
  vatNumber: foreignVatNumberSchema.nullish(),
  orgId: z.string().nullish(),
  name: z.string(),
  address: z.string().nullish(),
  gerepId: z.string().nullish(),
  codeNaf: z.string().nullish(),
  givenName: z.string().nullish(),
  contactEmail: z.string().email().nullish(),
  contactPhone: z.string().nullish(),
  contact: z.string().nullish(),
  website: z.string().nullish(),
  ecoOrganismeAgreements: z.array(z.string()).default([]),
  companyTypes: z
    .array(z.nativeEnum(CompanyType))
    .min(1)
    .transform(toSet)
    .refine(companyTypes => !companyTypes.includes(CompanyType.CREMATORIUM), {
      message:
        "Le type CREMATORIUM est déprécié, utiliser WasteProcessorTypes.CREMATION."
    }),
  wasteProcessorTypes: z
    .array(z.nativeEnum(WasteProcessorType))
    .nullish()
    .transform(toSet)
    .default([]),
  collectorTypes: z
    .array(z.nativeEnum(CollectorType))
    .nullish()
    .transform(toSet)
    .default([]),
  wasteVehiclesTypes: z
    .array(z.nativeEnum(WasteVehiclesType))
    .nullish()
    .transform(toSet)
    .default([]),
  transporterReceiptId: z.string().nullish(),
  traderReceiptId: z.string().nullish(),
  brokerReceiptId: z.string().nullish(),
  workerCertificationId: z.string().nullish(),
  vhuAgrementDemolisseurId: z.string().nullish(),
  vhuAgrementBroyeurId: z.string().nullish(),
  allowBsdasriTakeOverWithoutSignature: z.boolean().nullish().default(false),
  allowAppendix1SignatureAutomation: z.boolean().nullish().default(false)
});

export type ZodCompany = z.input<typeof rawCompanySchema>;
export type ParsedZodCompany = z.output<typeof rawCompanySchema>;

export const companySchema = rawCompanySchema
  .transform(setCompanyOrgId)
  .superRefine(checkForeignTransporter)
  .superRefine(checkEcoOrganisme)
  .superRefine(checkSubTypes)
  .superRefine(checkRecepisses);
