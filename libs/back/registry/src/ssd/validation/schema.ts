import {
  ADMINISTRATIVE_ACT_REFERENCES,
  SSD_PROCESSING_OPERATIONS_CODES
} from "@td/constants";
import { z } from "zod";
import {
  actorAddressSchema,
  actorCitySchema,
  actorCountryCodeSchema,
  actorNameSchema,
  actorOrgIdSchema,
  actorPostalCodeSchema,
  actorTypeSchema,
  siretSchema,
  getOperationCodeSchema,
  publicIdSchema,
  reasonSchema,
  reportAsCompanySiretSchema,
  volumeSchema,
  wasteCodeBaleSchema,
  getWasteCodeSchema,
  wasteDescriptionSchema,
  weightIsEstimateSchema,
  weightValueSchema,
  nullishDateSchema,
  dateSchema,
  stringToArraySchema,
  getOperationModeSchema
} from "../../shared/schemas";

export type ParsedZodInputSsdItem = z.output<typeof inputSsdSchema>;
export type ParsedZodSsdItem = z.output<typeof ssdSchema>;

const inputSsdSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: siretSchema,
  useDate: nullishDateSchema,
  dispatchDate: nullishDateSchema,
  wasteCode: getWasteCodeSchema(),
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  secondaryWasteCodes: z.union([
    stringToArraySchema.pipe(z.array(getWasteCodeSchema())),
    z.array(getWasteCodeSchema())
  ]),
  secondaryWasteDescriptions: z.union([
    stringToArraySchema.pipe(z.array(wasteDescriptionSchema)),
    z.array(wasteDescriptionSchema)
  ]),
  product: z
    .string()
    .trim()
    .min(2, "Le produit doit faire au moins 2 caractères")
    .max(300, "Le produit ne peut pas dépasser 300 caractères"),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  processingDate: dateSchema,
  processingEndDate: nullishDateSchema,
  destinationCompanyType: actorTypeSchema
    .exclude(["PERSONNE_PHYSIQUE", "COMMUNES"])
    .nullish(),
  destinationCompanyOrgId: actorOrgIdSchema.nullish(),
  destinationCompanyName: actorNameSchema.nullish(),
  destinationCompanyAddress: actorAddressSchema.nullish(),
  destinationCompanyCity: actorCitySchema.nullish(),
  destinationCompanyPostalCode: actorPostalCodeSchema.nullish(),
  destinationCompanyCountryCode: actorCountryCodeSchema.nullish(),
  operationCode: getOperationCodeSchema(SSD_PROCESSING_OPERATIONS_CODES),
  operationMode: getOperationModeSchema(SSD_OPERATION_MODES),
  administrativeActReference: z.enum(ADMINISTRATIVE_ACT_REFERENCES)
});

// Props added through transform
const transformedSsdSchema = z.object({
  reportForCompanyAddress: z.string().default(""),
  reportForCompanyCity: z.string().default(""),
  reportForCompanyPostalCode: z.string().default(""),
  reportForCompanyName: z.coerce.string().default(""),
  id: z.string().optional()
});

export const ssdSchema = inputSsdSchema.merge(transformedSsdSchema);
