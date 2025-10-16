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
  checkWorkerSubsection,
  checkSubTypes,
  checkEcoOrganismePartnersIds
} from "./refinements";
import { isValidWebsite } from "@td/constants";

function toSet(arr: any[]) {
  return arr ? [...new Set(arr)] : arr;
}

const rawCompanySchema = z.object({
  id: z.string().nullish(),
  siret: siretSchema().nullish(),
  vatNumber: foreignVatNumberSchema().nullish(),
  orgId: z.string().nullish(),
  name: z.string(),
  address: z.string().nullish(),
  gerepId: z.string().nullish(),
  codeNaf: z.string().nullish(),
  givenName: z.string().nullish(),
  contactEmail: z.string().email().nullish().or(z.literal("")), // accept empty strings
  contactPhone: z.string().nullish(),
  contact: z.string().nullish(),
  website: z
    .string()
    .nullish()
    .refine(v => {
      return v ? isValidWebsite(v) : true;
    }, "L'URL est invalide"),
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
    .transform(arr => arr ?? [])
    .transform(toSet),
  collectorTypes: z
    .array(z.nativeEnum(CollectorType))
    .nullish()
    .transform(arr => arr ?? [])
    .transform(toSet),
  wasteVehiclesTypes: z
    .array(z.nativeEnum(WasteVehiclesType))
    .nullish()
    .transform(arr => arr ?? [])
    .transform(toSet),
  transporterReceiptId: z.string().nullish(),
  traderReceiptId: z.string().nullish(),
  brokerReceiptId: z.string().nullish(),
  workerCertificationId: z.string().nullish(),
  vhuAgrementDemolisseurId: z.string().nullish(),
  vhuAgrementBroyeurId: z.string().nullish(),
  ecoOrganismePartnersIds: z
    .array(z.string())
    .transform(toSet)
    .nullish()
    .default([]),
  allowBsdasriTakeOverWithoutSignature: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  allowAppendix1SignatureAutomation: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v))
});

export type ZodCompany = z.input<typeof rawCompanySchema>;
export type ParsedZodCompany = z.output<typeof rawCompanySchema>;

export const companySchema = rawCompanySchema
  .transform(setCompanyOrgId)
  .superRefine(checkForeignTransporter)
  .superRefine(checkEcoOrganisme)
  .superRefine(checkSubTypes)
  .superRefine(checkRecepisses)
  .superRefine(checkWorkerSubsection)
  .superRefine(checkEcoOrganismePartnersIds);

const rawBulkUpdateCompanySchema = rawCompanySchema.pick({
  companyTypes: true,
  wasteProcessorTypes: true,
  collectorTypes: true,
  wasteVehiclesTypes: true
});

export const bulkUpdateCompanySchema =
  rawBulkUpdateCompanySchema.superRefine(checkSubTypes);
