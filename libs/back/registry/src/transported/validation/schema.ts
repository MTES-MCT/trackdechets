import { z } from "@td/validation";
import {
  reasonSchema,
  publicIdSchema,
  reportAsCompanySiretSchema,
  siretSchema,
  transportModeSchema,
  booleanSchema,
  transportRecepisseNumberSchema,
  transportPlatesSchema,
  wasteDescriptionSchema,
  getWasteCodeSchema,
  wasteCodeBaleSchema,
  dateSchema,
  weightValueSchema,
  weightIsEstimateSchema,
  volumeSchema,
  actorTypeSchema,
  actorOrgIdSchema,
  actorNameSchema,
  actorAddressSchema,
  actorPostalCodeSchema,
  actorCitySchema,
  actorCountryCodeSchema,
  gistridNumberSchema,
  actorSiretSchema
} from "../../shared/schemas";

export type ParsedZodInputTransportedItem = z.output<
  typeof inputTransportedSchema
>;
export type ParsedZodTransportedItem = z.output<typeof transportedSchema>;

const inputTransportedSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: siretSchema,
  reportForTransportMode: transportModeSchema,
  reportForTransportIsWaste: booleanSchema,
  reportForRecepisseIsExempted: booleanSchema.nullish(),
  reportForRecepisseNumber: transportRecepisseNumberSchema.nullish(),
  reportForTransportAdr: z.string().nullish(),
  reportForTransportOtherTmdCode: z.string().nullish(),
  reportForTransportPlates: transportPlatesSchema,
  wasteDescription: wasteDescriptionSchema,
  wasteCode: getWasteCodeSchema().nullish(),
  wasteCodeBale: wasteCodeBaleSchema,
  wastePop: booleanSchema.nullish(),
  wasteIsDangerous: booleanSchema.nullish(),
  collectionDate: dateSchema,
  unloadingDate: dateSchema,
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  emitterCompanyType: actorTypeSchema.exclude(["COMMUNES"]),
  emitterCompanyOrgId: actorOrgIdSchema,
  emitterCompanyName: actorNameSchema.nullish(),
  emitterCompanyAddress: actorAddressSchema.nullish(),
  emitterCompanyPostalCode: actorPostalCodeSchema.nullish(),
  emitterCompanyCity: actorCitySchema.nullish(),
  emitterCompanyCountryCode: actorCountryCodeSchema.nullish(),
  emitterPickupSiteName: z
    .string()
    .trim()
    .max(
      300,
      "La référence du chantier ou du lieu de collecte de l'expéditeur ne peut pas faire plus de 300 caractères"
    )
    .nullish(),
  emitterPickupSiteAddress: actorAddressSchema.nullish(),
  emitterPickupSitePostalCode: actorPostalCodeSchema.nullish(),
  emitterPickupSiteCity: actorCitySchema.nullish(),
  emitterPickupSiteCountryCode: actorCountryCodeSchema.nullish(),
  destinationCompanyType: actorTypeSchema.exclude(["COMMUNES"]),
  destinationCompanyOrgId: actorOrgIdSchema.nullish(),
  destinationCompanyName: actorNameSchema.nullish(),
  destinationCompanyAddress: actorAddressSchema.nullish(),
  destinationCompanyPostalCode: actorPostalCodeSchema.nullish(),
  destinationCompanyCity: actorCitySchema.nullish(),
  destinationCompanyCountryCode: actorCountryCodeSchema.nullish(),
  destinationDropSiteAddress: actorAddressSchema.nullish(),
  destinationDropSitePostalCode: actorPostalCodeSchema.nullish(),
  destinationDropSiteCity: actorCitySchema.nullish(),
  destinationDropSiteCountryCode: actorCountryCodeSchema.nullish(),
  gistridNumber: gistridNumberSchema,
  movementNumber: z
    .string()
    .trim()
    .max(75, "Le numéro de mouvement ne peut pas excéder 75 caractères")
    .nullish(),
  ecoOrganismeSiret: actorSiretSchema.nullish(),
  ecoOrganismeName: actorNameSchema.nullish(),
  brokerCompanySiret: actorSiretSchema.nullish(),
  brokerCompanyName: actorNameSchema.nullish(),
  brokerRecepisseNumber: z
    .string()
    .trim()
    .max(
      150,
      "Le numéro de récépissé du courtier ne doit pas excéder 150 caractères"
    )
    .nullish(),
  traderCompanySiret: actorSiretSchema.nullish(),
  traderCompanyName: actorNameSchema.nullish(),
  traderRecepisseNumber: z
    .string()
    .trim()
    .max(
      150,
      "Le numéro de récépissé du négociant ne doit pas excéder 150 caractères"
    )
    .nullish()
});

// Props added through transform
const transformedTransportedSchema = z.object({
  reportForCompanyAddress: z.string().default(""),
  reportForCompanyCity: z.string().default(""),
  reportForCompanyPostalCode: z.string().default(""),
  reportForCompanyName: z.coerce.string().default(""),
  id: z.string().optional()
});

export const transportedSchema = inputTransportedSchema.merge(
  transformedTransportedSchema
);
