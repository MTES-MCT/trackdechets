import { z } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  reportAsCompanySiretSchema,
  getWasteCodeSchema,
  wastePopSchema,
  wasteIsDangerousSchema,
  receptionDateSchema,
  wasteDescriptionSchema,
  wasteCodeBaleSchema,
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
  inseeCodesSchema,
  isUpcycledSchema,
  actorSiretSchema,
  getOperationCodeSchema,
  transportModeSchema,
  transportRecepisseNumberSchema,
  declarationNumberSchema,
  notificationNumberSchema,
  siretSchema,
  parcelCoordinatesSchema,
  parcelNumbersSchema,
  municipalitiesNamesSchema,
  nextDestinationIsAbroad,
  noTraceability,
  operationModeSchema,
  transportRecepisseIsExemptedSchema
} from "../../shared/schemas";
import {
  INCOMING_TEXS_PROCESSING_OPERATIONS_CODES,
  INCOMING_TEXS_WASTE_CODES
} from "@td/constants";

export type ParsedZodInputIncomingTexsItem = z.output<
  typeof inputIncomingTexsSchema
>;
export type ParsedZodIncomingTexsItem = z.output<typeof incomingTexsSchema>;

const inputIncomingTexsSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: siretSchema,
  wasteCode: getWasteCodeSchema(INCOMING_TEXS_WASTE_CODES).nullish(),
  wastePop: wastePopSchema,
  wasteIsDangerous: wasteIsDangerousSchema,
  receptionDate: receptionDateSchema,
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  wasteDap: z
    .string()
    .max(50, "Le DAP ne doit pas excéder 50 caractères")
    .nullish(),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  parcelInseeCodes: inseeCodesSchema,
  parcelNumbers: parcelNumbersSchema,
  parcelCoordinates: parcelCoordinatesSchema,
  sisIdentifier: z
    .string()
    .max(13, "Un identifiant SIS ne doit pas excéder 13 caractères")
    .nullish(),
  initialEmitterCompanyType: actorTypeSchema,
  initialEmitterCompanyOrgId: actorOrgIdSchema,
  initialEmitterCompanyName: actorNameSchema,
  initialEmitterCompanyAddress: actorAddressSchema,
  initialEmitterCompanyPostalCode: actorPostalCodeSchema,
  initialEmitterCompanyCity: actorCitySchema,
  initialEmitterCompanyCountryCode: actorCountryCodeSchema,
  initialEmitterMunicipalitiesInseeCodes: inseeCodesSchema,
  initialEmitterMunicipalitiesNames: municipalitiesNamesSchema,
  emitterCompanyType: actorTypeSchema,
  emitterCompanyOrgId: actorOrgIdSchema,
  emitterCompanyName: actorNameSchema,
  emitterCompanyAddress: actorAddressSchema,
  emitterCompanyPostalCode: actorPostalCodeSchema,
  emitterCompanyCity: actorCitySchema,
  emitterCompanyCountryCode: actorCountryCodeSchema,
  emitterPickupSiteName: z.string().nullish(),
  emitterPickupSiteAddress: actorAddressSchema.nullish(),
  emitterPickupSitePostalCode: actorPostalCodeSchema.nullish(),
  emitterPickupSiteCity: actorCitySchema.nullish(),
  emitterPickupSiteCountryCode: actorCountryCodeSchema.nullish(),
  ecoOrganismeSiret: actorSiretSchema.nullish(),
  ecoOrganismeName: actorNameSchema.nullish(),
  brokerCompanySiret: actorSiretSchema.nullish(),
  brokerCompanyName: actorNameSchema.nullish(),
  brokerRecepisseNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du courtier ne doit pas excéder 150 caractères"
    )
    .nullish(),
  traderCompanySiret: actorSiretSchema.nullish(),
  traderCompanyName: actorNameSchema.nullish(),
  traderRecepisseNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du négociant ne doit pas excéder 150 caractères"
    )
    .nullish(),
  operationCode: getOperationCodeSchema(
    INCOMING_TEXS_PROCESSING_OPERATIONS_CODES
  ),
  operationMode: operationModeSchema,
  noTraceability: noTraceability.nullish(),
  nextDestinationIsAbroad: nextDestinationIsAbroad.nullish(),
  declarationNumber: declarationNumberSchema,
  notificationNumber: notificationNumberSchema,
  movementNumber: z
    .string()
    .max(75, "Le numéro de mouvement ne peut pas excéder 75 caractères")
    .nullish(),
  nextOperationCode: getOperationCodeSchema(
    INCOMING_TEXS_PROCESSING_OPERATIONS_CODES
  ).nullish(),
  isUpcycled: isUpcycledSchema.nullish(),
  destinationParcelInseeCodes: inseeCodesSchema,
  destinationParcelNumbers: parcelNumbersSchema,
  destinationParcelCoordinates: parcelCoordinatesSchema,
  isDirectSupply: z.boolean().nullish(),
  transporter1TransportMode: transportModeSchema.nullish(),
  transporter1CompanyType: actorTypeSchema.nullish(),
  transporter1CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter1RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter1RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter1CompanyName: actorNameSchema.nullish(),
  transporter1CompanyAddress: actorAddressSchema.nullish(),
  transporter1CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter1CompanyCity: actorCitySchema.nullish(),
  transporter1CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter2TransportMode: transportModeSchema.nullish(),
  transporter2CompanyType: actorTypeSchema.nullish(),
  transporter2CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter2RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter2RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter2CompanyName: actorNameSchema.nullish(),
  transporter2CompanyAddress: actorAddressSchema.nullish(),
  transporter2CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter2CompanyCity: actorCitySchema.nullish(),
  transporter2CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter3TransportMode: transportModeSchema.nullish(),
  transporter3CompanyType: actorTypeSchema.nullish(),
  transporter3CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter3RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter3RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter3CompanyName: actorNameSchema.nullish(),
  transporter3CompanyAddress: actorAddressSchema.nullish(),
  transporter3CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter3CompanyCity: actorCitySchema.nullish(),
  transporter3CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter4TransportMode: transportModeSchema.nullish(),
  transporter4CompanyType: actorTypeSchema.nullish(),
  transporter4CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter4RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter4RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter4CompanyName: actorNameSchema.nullish(),
  transporter4CompanyAddress: actorAddressSchema.nullish(),
  transporter4CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter4CompanyCity: actorCitySchema.nullish(),
  transporter4CompanyCountryCode: actorCountryCodeSchema.nullish(),
  transporter5TransportMode: transportModeSchema.nullish(),
  transporter5CompanyType: actorTypeSchema.nullish(),
  transporter5CompanyOrgId: actorOrgIdSchema.nullish(),
  transporter5RecepisseIsExempted: transportRecepisseIsExemptedSchema.nullish(),
  transporter5RecepisseNumber: transportRecepisseNumberSchema.nullish(),
  transporter5CompanyName: actorNameSchema.nullish(),
  transporter5CompanyAddress: actorAddressSchema.nullish(),
  transporter5CompanyPostalCode: actorPostalCodeSchema.nullish(),
  transporter5CompanyCity: actorCitySchema.nullish(),
  transporter5CompanyCountryCode: actorCountryCodeSchema.nullish()
});

// Props added through transform
const transformedIncomingTexsSchema = z.object({
  id: z.string().optional(),
  reportForCompanyAddress: z.string().default(""),
  reportForCompanyCity: z.string().default(""),
  reportForCompanyPostalCode: z.string().default(""),
  reportForCompanyName: z.coerce.string().default("")
});

export const incomingTexsSchema = inputIncomingTexsSchema.merge(
  transformedIncomingTexsSchema
);
