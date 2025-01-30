import {
  INCOMING_TEXS_WASTE_CODES,
  INCOMING_TEXS_PROCESSING_OPERATIONS_CODES
} from "@td/constants";
import { z } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  reportAsCompanySiretSchema,
  siretSchema,
  actorAddressSchema,
  actorPostalCodeSchema,
  actorCitySchema,
  actorCountryCodeSchema,
  wasteDescriptionSchema,
  getWasteCodeSchema,
  wastePopSchema,
  wasteIsDangerousSchema,
  wasteCodeBaleSchema,
  weightValueSchema,
  weightIsEstimateSchema,
  volumeSchema,
  actorTypeSchema,
  actorOrgIdSchema,
  actorNameSchema,
  inseeCodesSchema,
  municipalitiesNamesSchema,
  parcelNumbersSchema,
  parcelCoordinatesSchema,
  getOperationCodeSchema,
  operationModeSchema,
  isUpcycledSchema,
  declarationNumberSchema,
  notificationNumberSchema,
  actorSiretSchema,
  transportModeSchema,
  transportRecepisseIsExemptedSchema,
  transportRecepisseNumberSchema,
  nullishDateSchema
} from "../../shared/schemas";

export type ParsedZodInputOutgoingTexsItem = z.output<
  typeof inputOutgoingTexsSchema
>;
export type ParsedZodOutgoingTexsItem = z.output<typeof outgoingTexsSchema>;

const inputOutgoingTexsSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: siretSchema,
  reportForPickupSiteName: z.string().nullish(),
  reportForPickupSiteAddress: actorAddressSchema.nullish(),
  reportForPickupSitePostalCode: actorPostalCodeSchema.nullish(),
  reportForPickupSiteCity: actorCitySchema.nullish(),
  reportForPickupSiteCountryCode: actorCountryCodeSchema.nullish(),
  wasteDescription: wasteDescriptionSchema,
  wasteCode: getWasteCodeSchema(INCOMING_TEXS_WASTE_CODES),
  wastePop: wastePopSchema,
  wasteIsDangerous: wasteIsDangerousSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  dispatchDate: nullishDateSchema,
  wasteDap: z
    .string()
    .max(50, "Le DAP ne doit pas excéder 50 caractères")
    .nullish(),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  initialEmitterCompanyType: actorTypeSchema,
  initialEmitterCompanyOrgId: actorOrgIdSchema,
  initialEmitterCompanyName: actorNameSchema,
  initialEmitterCompanyAddress: actorAddressSchema,
  initialEmitterCompanyPostalCode: actorPostalCodeSchema,
  initialEmitterCompanyCity: actorCitySchema,
  initialEmitterCompanyCountryCode: actorCountryCodeSchema,
  initialEmitterMunicipalitiesInseeCodes: inseeCodesSchema,
  initialEmitterMunicipalitiesNames: municipalitiesNamesSchema,
  parcelInseeCodes: inseeCodesSchema,
  parcelNumbers: parcelNumbersSchema,
  parcelCoordinates: parcelCoordinatesSchema,
  sisIdentifier: z
    .string()
    .max(13, "Un identifiant SIS ne doit pas excéder 13 caractères")
    .nullish(),
  destinationCompanyType: actorTypeSchema,
  destinationCompanyOrgId: actorOrgIdSchema,
  destinationCompanyName: actorNameSchema,
  destinationCompanyAddress: actorAddressSchema,
  destinationCompanyPostalCode: actorPostalCodeSchema,
  destinationCompanyCity: actorCitySchema,
  destinationCompanyCountryCode: actorCountryCodeSchema,
  destinationDropSiteAddress: actorAddressSchema.nullish(),
  destinationDropSitePostalCode: actorPostalCodeSchema.nullish(),
  destinationDropSiteCity: actorCitySchema.nullish(),
  destinationDropSiteCountryCode: actorCountryCodeSchema.nullish(),
  operationCode: getOperationCodeSchema(
    INCOMING_TEXS_PROCESSING_OPERATIONS_CODES
  ),
  operationMode: operationModeSchema,
  isUpcycled: isUpcycledSchema.nullish(),
  destinationParcelInseeCodes: inseeCodesSchema,
  destinationParcelNumbers: parcelNumbersSchema,
  destinationParcelCoordinates: parcelCoordinatesSchema,
  declarationNumber: declarationNumberSchema,
  notificationNumber: notificationNumberSchema,
  movementNumber: z
    .string()
    .max(75, "Le numéro de mouvement ne peut pas excéder 75 caractères")
    .nullish(),
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
const transformedOutgoingTexsSchema = z.object({
  id: z.string().optional(),
  reportForCompanyAddress: z.string().default(""),
  reportForCompanyCity: z.string().default(""),
  reportForCompanyPostalCode: z.string().default(""),
  reportForCompanyName: z.coerce.string().default("")
});

export const outgoingTexsSchema = inputOutgoingTexsSchema.merge(
  transformedOutgoingTexsSchema
);
