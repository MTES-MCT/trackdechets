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
  getActorTypeSchema,
  getActorOrgIdSchema,
  getActorNameSchema,
  getActorAddressSchema,
  getActorPostalCodeSchema,
  getActorCitySchema,
  getActorCountryCodeSchema,
  inseeCodesSchema,
  getActorSiretSchema,
  getOperationCodeSchema,
  transportModeSchema,
  transportRecepisseNumberSchema,
  declarationNumberSchema,
  notificationNumberSchema,
  getReportForSiretSchema,
  parcelCoordinatesSchema,
  parcelNumbersSchema,
  municipalitiesNamesSchema,
  nextDestinationIsAbroad,
  noTraceability,
  operationModeSchema
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
  customInfo: z.string().nullish(),
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: getReportForSiretSchema("du destinataire"),
  wasteCode: getWasteCodeSchema(INCOMING_TEXS_WASTE_CODES),
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
  sisIdentifiers: z
    .string()
    .nullish()
    .transform(val =>
      val
        ? String(val)
            .split(",")
            .map(val => val.trim())
        : []
    )
    .pipe(
      z.array(
        z
          .string()
          .max(13, "Un identifiant SIS ne doit pas excéder 13 caractères")
      )
    ),
  initialEmitterCompanyType: getActorTypeSchema("de producteur initial"),
  initialEmitterCompanyOrgId: getActorOrgIdSchema("du producteur initial"),
  initialEmitterCompanyName: getActorNameSchema("du producteur initial"),
  initialEmitterCompanyAddress: getActorAddressSchema("du producteur initial"),
  initialEmitterCompanyPostalCode: getActorPostalCodeSchema(
    "du producteur initial"
  ),
  initialEmitterCompanyCity: getActorCitySchema("du producteur initial"),
  initialEmitterCompanyCountryCode: getActorCountryCodeSchema(
    "du producteur initial"
  ),
  initialEmitterMunicipalitiesInseeCodes: inseeCodesSchema,
  initialEmitterMunicipalitiesNames: municipalitiesNamesSchema,
  emitterCompanyType: getActorTypeSchema("d'expéditeur ou détenteur"),
  emitterCompanyOrgId: getActorOrgIdSchema("d'expéditeur ou détenteur"),
  emitterCompanyName: getActorNameSchema("d'expéditeur ou détenteur'"),
  emitterCompanyAddress: getActorAddressSchema("d'expéditeur ou détenteur"),
  emitterCompanyPostalCode: getActorPostalCodeSchema(
    "d'expéditeur ou détenteur"
  ),
  emitterCompanyCity: getActorCitySchema("d'expéditeur ou détenteur"),
  emitterCompanyCountryCode: getActorCountryCodeSchema(
    "d'expéditeur ou détenteur"
  ),
  emitterPickupSiteAddress: getActorAddressSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).nullish(),
  emitterPickupSitePostalCode: getActorPostalCodeSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).nullish(),
  emitterPickupSiteCity: getActorCitySchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).nullish(),
  emitterPickupSiteCountryCode: getActorCountryCodeSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).nullish(),
  brokerCompanySiret: getActorSiretSchema("du courtier").nullish(),
  brokerCompanyName: getActorNameSchema("du courtier").nullish(),
  brokerCompanyRecepisseNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du courtier ne doit pas excéder 150 caractères"
    )
    .nullish(),
  traderCompanySiret: getActorSiretSchema("du négociant").nullish(),
  traderCompanyName: getActorNameSchema("du négociant").nullish(),
  traderCompanyRecepisseNumber: z
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
  movementNumber: z.string().nullish(),
  nextOperationCode: getOperationCodeSchema(
    INCOMING_TEXS_PROCESSING_OPERATIONS_CODES
  ).nullish(),
  isUpcycled: z.boolean().nullish(),
  destinationParcelInseeCodes: inseeCodesSchema,
  destinationParcelNumbers: parcelNumbersSchema,
  destinationParcelCoordinates: parcelCoordinatesSchema,
  transporter1TransportMode: transportModeSchema,
  transporter1CompanyType: getActorTypeSchema("de transporteur 1"),
  transporter1CompanyOrgId: getActorOrgIdSchema("du transporteur 1"),
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
