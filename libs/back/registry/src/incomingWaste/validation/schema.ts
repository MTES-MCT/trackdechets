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
  getActorTypeSchema,
  getActorOrgIdSchema,
  getActorAddressSchema,
  getActorCitySchema,
  getActorCountryCodeSchema,
  getActorNameSchema,
  getActorPostalCodeSchema,
  transportModeSchema,
  transportRecepisseNumberSchema,
  getOperationCodeSchema,
  getActorSiretSchema,
  wastePopSchema,
  wasteIsDangerousSchema,
  receptionDateSchema,
  inseeCodesSchema,
  declarationNumberSchema,
  notificationNumberSchema,
  getReportForSiretSchema,
  municipalitiesNamesSchema,
  nextDestinationIsAbroad,
  noTraceability,
  operationModeSchema,
  transportRecepisseIsExemptedSchema
} from "../../shared/schemas";
import { INCOMING_WASTE_PROCESSING_OPERATIONS_CODES } from "@td/constants";

export type ParsedZodInputIncomingWasteItem = z.output<
  typeof inputIncomingWasteSchema
>;
export type ParsedZodIncomingWasteItem = z.output<typeof incomingWasteSchema>;

const inputIncomingWasteSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: getReportForSiretSchema("du destinataire"),
  wasteCode: getWasteCodeSchema(),
  wastePop: wastePopSchema,
  wasteIsDangerous: wasteIsDangerousSchema,
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  receptionDate: receptionDateSchema,
  weighingHour: z
    .string()
    .refine(val => {
      if (!val) {
        return true;
      }
      // 00:00 or 00:00:00 or 00:00:00.000
      return /^\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?$/.test(val);
    }, `L'heure de pesée n'est pas valide. Format attendu: 00:00, 00:00:00 ou 00:00:00.000`)
    .nullish(),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  initialEmitterCompanyType: getActorTypeSchema("de producteur"),
  initialEmitterCompanyOrgId: getActorOrgIdSchema("du producteur"),
  initialEmitterCompanyName: getActorNameSchema("du producteur"),
  initialEmitterCompanyAddress: getActorAddressSchema("du producteur"),
  initialEmitterCompanyPostalCode: getActorPostalCodeSchema("du producteur"),
  initialEmitterCompanyCity: getActorCitySchema("du producteur"),
  initialEmitterCompanyCountryCode: getActorCountryCodeSchema("du producteur"),
  initialEmitterMunicipalitiesInseeCodes: inseeCodesSchema,
  initialEmitterMunicipalitiesNames: municipalitiesNamesSchema,
  emitterCompanyType: getActorTypeSchema("d'expéditeur"),
  emitterCompanyOrgId: getActorOrgIdSchema("d'expéditeur"),
  emitterCompanyName: getActorNameSchema("d'expéditeur'"),
  emitterCompanyAddress: getActorAddressSchema("d'expéditeur"),
  emitterCompanyPostalCode: getActorPostalCodeSchema("d'expéditeur"),
  emitterCompanyCity: getActorCitySchema("d'expéditeur"),
  emitterCompanyCountryCode: getActorCountryCodeSchema("d'expéditeur"),
  emitterPickupSiteName: z.string().nullish(),
  emitterPickupSiteAddress: getActorAddressSchema(
    "de prise en charge de l'expéditeur"
  ).nullish(),
  emitterPickupSitePostalCode: getActorPostalCodeSchema(
    "de prise en charge de l'expéditeur"
  ).nullish(),
  emitterPickupSiteCity: getActorCitySchema(
    "de prise en charge de l'expéditeur"
  ).nullish(),
  emitterPickupSiteCountryCode: getActorCountryCodeSchema(
    "de prise en charge de l'expéditeur"
  ).nullish(),
  brokerCompanySiret: getActorSiretSchema("du courtier").nullish(),
  brokerCompanyName: getActorNameSchema("du courtier").nullish(),
  brokerRecepisseNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du courtier ne doit pas excéder 150 caractères"
    )
    .nullish(),
  traderCompanySiret: getActorSiretSchema("du négociant").nullish(),
  traderCompanyName: getActorNameSchema("du négociant").nullish(),
  traderRecepisseNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du négociant ne doit pas excéder 150 caractères"
    )
    .nullish(),
  ecoOrganismeSiret: getActorSiretSchema("de l'éco-organisme").nullish(),
  ecoOrganismeName: getActorNameSchema("de l'éco-organisme").nullish(),
  operationCode: getOperationCodeSchema(
    INCOMING_WASTE_PROCESSING_OPERATIONS_CODES
  ),
  operationMode: operationModeSchema,
  noTraceability: noTraceability.nullish(),
  nextDestinationIsAbroad: nextDestinationIsAbroad.nullish(),
  declarationNumber: declarationNumberSchema,
  notificationNumber: notificationNumberSchema,
  movementNumber: z.string().nullish(),
  nextOperationCode: getOperationCodeSchema(
    INCOMING_WASTE_PROCESSING_OPERATIONS_CODES
  ).nullish(),
  transporter1TransportMode: transportModeSchema,
  transporter1CompanyType: getActorTypeSchema("de transporteur 1"),
  transporter1CompanyOrgId: getActorOrgIdSchema("du transporteur 1"),
  transporter1RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter1RecepisseNumber: transportRecepisseNumberSchema,
  transporter1CompanyName: getActorNameSchema("du transporteur 1"),
  transporter1CompanyAddress: getActorAddressSchema("du transporteur 1"),
  transporter1CompanyPostalCode: getActorPostalCodeSchema("du transporteur 1"),
  transporter1CompanyCity: getActorCitySchema("du transporteur 1"),
  transporter1CompanyCountryCode:
    getActorCountryCodeSchema("du transporteur 1"),
  transporter2TransportMode: transportModeSchema.nullish(),
  transporter2CompanyType: getActorTypeSchema("de transporteur 2").nullish(),
  transporter2CompanyOrgId: getActorOrgIdSchema("du transporteur 2").nullish(),
  transporter2RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter2RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter2CompanyName: getActorNameSchema("du transporteur 2").nullish(),
  transporter2CompanyAddress:
    getActorAddressSchema("du transporteur 2").nullish(),
  transporter2CompanyPostalCode:
    getActorPostalCodeSchema("du transporteur 2").nullish(),
  transporter2CompanyCity: getActorCitySchema("du transporteur 2").nullish(),
  transporter2CompanyCountryCode:
    getActorCountryCodeSchema("du transporteur 2").nullish(),
  transporter3TransportMode: transportModeSchema.nullish(),
  transporter3CompanyType: getActorTypeSchema("de transporteur 3").nullish(),
  transporter3CompanyOrgId: getActorOrgIdSchema("du transporteur 3").nullish(),
  transporter3RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter3RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter3CompanyName: getActorNameSchema("du transporteur 3").nullish(),
  transporter3CompanyAddress:
    getActorAddressSchema("du transporteur 3").nullish(),
  transporter3CompanyPostalCode:
    getActorPostalCodeSchema("du transporteur 3").nullish(),
  transporter3CompanyCity: getActorCitySchema("du transporteur 3").nullish(),
  transporter3CompanyCountryCode:
    getActorCountryCodeSchema("du transporteur 3").nullish(),
  transporter4TransportMode: transportModeSchema.nullish(),
  transporter4CompanyType: getActorTypeSchema("de transporteur 4").nullish(),
  transporter4CompanyOrgId: getActorOrgIdSchema("du transporteur 4").nullish(),
  transporter4RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter4RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter4CompanyName: getActorNameSchema("du transporteur 4").nullish(),
  transporter4CompanyAddress:
    getActorAddressSchema("du transporteur 4").nullish(),
  transporter4CompanyPostalCode:
    getActorPostalCodeSchema("du transporteur 4").nullish(),
  transporter4CompanyCity: getActorCitySchema("du transporteur 4").nullish(),
  transporter4CompanyCountryCode:
    getActorCountryCodeSchema("du transporteur 4").nullish(),
  transporter5TransportMode: transportModeSchema.nullish(),
  transporter5CompanyType: getActorTypeSchema("de transporteur 5").nullish(),
  transporter5CompanyOrgId: getActorOrgIdSchema("du transporteur 5").nullish(),
  transporter5RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter5RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter5CompanyName: getActorNameSchema("du transporteur 5").nullish(),
  transporter5CompanyAddress:
    getActorAddressSchema("du transporteur 5").nullish(),
  transporter5CompanyPostalCode:
    getActorPostalCodeSchema("du transporteur 5").nullish(),
  transporter5CompanyCity: getActorCitySchema("du transporteur 5").nullish(),
  transporter5CompanyCountryCode:
    getActorCountryCodeSchema("du transporteur 5").nullish()
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
