import { z } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  reportAsCompanySiretSchema,
  getWasteCodeSchema,
  wasteCodeBaleSchema,
  wasteDescriptionSchema,
  volumeSchema,
  weightIsEstimateSchema,
  weightValueSchema,
  actorTypeSchema,
  actorOrgIdSchema,
  actorAddressSchema,
  actorCitySchema,
  actorCountryCodeSchema,
  actorNameSchema,
  actorPostalCodeSchema,
  transportModeSchema,
  transportRecepisseNumberSchema,
  getOperationCodeSchema,
  actorSiretSchema,
  booleanSchema,
  dateSchema,
  inseeCodesSchema,
  ttdNumberSchema,
  siretSchema,
  getOperationModeSchema
} from "../../shared/schemas";
import {
  INCOMING_WASTE_PROCESSING_OPERATIONS_CODES,
  INCOMING_WASTE_WASTE_CODES
} from "@td/constants";

export type ParsedZodInputIncomingWasteItem = z.output<
  typeof inputIncomingWasteSchema
>;
export type ParsedZodIncomingWasteItem = z.output<typeof incomingWasteSchema>;

const inputIncomingWasteSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: siretSchema,
  wasteCode: getWasteCodeSchema(INCOMING_WASTE_WASTE_CODES),
  wastePop: booleanSchema,
  wasteIsDangerous: booleanSchema.nullish(),
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  receptionDate: dateSchema,
  weighingHour: z.coerce
    .string()
    .trim()
    .refine(val => {
      if (!val) {
        return true;
      }
      // 00:00 or 00:00:00 or 00:00:00.000
      const timeRegex =
        /^([0-9]|[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9](?:\.\d{1,3})?)?$/;

      if (!timeRegex.test(val)) {
        return false; // Invalid format
      }

      const [hours, minutes, seconds] = val.split(":");
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      const second = seconds ? parseFloat(seconds) : 0;

      if (hour < 0 || hour >= 24) return false;
      if (minute < 0 || minute >= 60) return false;
      if (second < 0 || second >= 60) return false;

      return true;
    }, `Le format d'heure saisi n'est pas valide. Format attendu: 00:00, 00:00:00 ou 00:00:00.000`)
    .nullish(),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  initialEmitterCompanyType: actorTypeSchema.nullish(),
  initialEmitterCompanyOrgId: actorOrgIdSchema.nullish(),
  initialEmitterCompanyName: actorNameSchema.nullish(),
  initialEmitterCompanyAddress: actorAddressSchema.nullish(),
  initialEmitterCompanyPostalCode: actorPostalCodeSchema.nullish(),
  initialEmitterCompanyCity: actorCitySchema.nullish(),
  initialEmitterCompanyCountryCode: actorCountryCodeSchema.nullish(),
  initialEmitterMunicipalitiesInseeCodes: inseeCodesSchema,
  emitterCompanyType: actorTypeSchema.exclude(["COMMUNES"]),
  emitterCompanyOrgId: actorOrgIdSchema.nullish(),
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
  brokerCompanySiret: actorSiretSchema.nullish(),
  brokerCompanyName: actorNameSchema.nullish(),
  brokerRecepisseNumber: z
    .string()
    .trim()
    .max(
      50,
      "Le numéro de récépissé du courtier ne doit pas excéder 50 caractères"
    )
    .nullish(),
  traderCompanySiret: actorSiretSchema.nullish(),
  traderCompanyName: actorNameSchema.nullish(),
  traderRecepisseNumber: z
    .string()
    .trim()
    .max(
      50,
      "Le numéro de récépissé du négociant ne doit pas excéder 50 caractères"
    )
    .nullish(),
  ecoOrganismeSiret: actorSiretSchema.nullish(),
  ecoOrganismeName: actorNameSchema.nullish(),
  operationCode: getOperationCodeSchema(
    INCOMING_WASTE_PROCESSING_OPERATIONS_CODES
  ),
  operationMode: getOperationModeSchema(),
  noTraceability: booleanSchema.nullish(),
  ttdImportNumber: ttdNumberSchema,
  movementNumber: z
    .string()
    .trim()
    .max(75, "Le numéro de mouvement ne peut pas excéder 75 caractères")
    .nullish(),
  nextOperationCode: getOperationCodeSchema(
    INCOMING_WASTE_PROCESSING_OPERATIONS_CODES
  ).nullish(),
  isDirectSupply: booleanSchema.nullish(),
  transporter1TransportMode: transportModeSchema.nullish(),
  transporter1CompanyType: actorTypeSchema.nullish(),
  transporter1CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter1RecepisseIsExempted: booleanSchema.nullish(),
  transporter1RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter1CompanyName: actorNameSchema.nullish(),
  transporter1CompanyAddress: actorAddressSchema.nullish(),
  transporter1CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter1CompanyCity: actorCitySchema.nullish(),
  transporter1CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter2TransportMode: transportModeSchema.nullish(),
  transporter2CompanyType: actorTypeSchema.nullish(),
  transporter2CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter2RecepisseIsExempted: booleanSchema.nullish(),
  transporter2RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter2CompanyName: actorNameSchema.nullish(),
  transporter2CompanyAddress: actorAddressSchema.nullish(),
  transporter2CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter2CompanyCity: actorCitySchema.nullish(),
  transporter2CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter3TransportMode: transportModeSchema.nullish(),
  transporter3CompanyType: actorTypeSchema.nullish(),
  transporter3CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter3RecepisseIsExempted: booleanSchema.nullish(),
  transporter3RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter3CompanyName: actorNameSchema.nullish(),
  transporter3CompanyAddress: actorAddressSchema.nullish(),
  transporter3CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter3CompanyCity: actorCitySchema.nullish(),
  transporter3CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter4TransportMode: transportModeSchema.nullish(),
  transporter4CompanyType: actorTypeSchema.nullish(),
  transporter4CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter4RecepisseIsExempted: booleanSchema.nullish(),
  transporter4RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter4CompanyName: actorNameSchema.nullish(),
  transporter4CompanyAddress: actorAddressSchema.nullish(),
  transporter4CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter4CompanyCity: actorCitySchema.nullish(),
  transporter4CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter5TransportMode: transportModeSchema.nullish(),
  transporter5CompanyType: actorTypeSchema.nullish(),
  transporter5CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter5RecepisseIsExempted: booleanSchema.nullish(),
  transporter5RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter5CompanyName: actorNameSchema.nullish(),
  transporter5CompanyAddress: actorAddressSchema.nullish(),
  transporter5CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter5CompanyCity: actorCitySchema.nullish(),
  transporter5CompanyCountryCode: actorCountryCodeSchema.nullish()
});

// Props added through transform
const transformedIncomingWasteSchema = z.object({
  id: z.string().optional(),
  reportForCompanyAddress: z.string().default(""),
  reportForCompanyCity: z.string().default(""),
  reportForCompanyPostalCode: z.string().default(""),
  reportForCompanyName: z.coerce.string().default("")
});

export const incomingWasteSchema = inputIncomingWasteSchema.merge(
  transformedIncomingWasteSchema
);
