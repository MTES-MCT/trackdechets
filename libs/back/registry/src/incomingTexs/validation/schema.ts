import { z } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  reportAsSiretSchema,
  wasteCodeSchema,
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
  operationCodeSchema,
  transportModeSchema,
  transportReceiptNumberSchema,
  declarationNumberSchema,
  notificationNumberSchema,
  getReportForSiretSchema,
  parcelCoordinatesSchema,
  parcelNumbersSchema,
  municipalitiesNamesSchema,
  nextDestinationIsAbroad
} from "../../shared/schemas";

export type ParsedZodIncomingTexsItem = z.output<typeof incomingTexsSchema>;

const inputIncomingTexsSchema = z.object({
  reason: reasonSchema,
  custominfo: z.string().optional(),
  publicId: publicIdSchema,
  reportAsSiret: reportAsSiretSchema,
  reportForSiret: getReportForSiretSchema("du destinataire"),
  wasteCode: wasteCodeSchema,
  wastePop: wastePopSchema,
  wasteIsDangerous: wasteIsDangerousSchema,
  receptionDate: receptionDateSchema,
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  dap: z
    .string()
    .max(50, "Le DAP ne doit pas excéder 50 caractères")
    .optional(),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  parcelInseeCodes: inseeCodesSchema,
  parcelNumbers: parcelNumbersSchema.optional(),
  parcelCoordinates: parcelCoordinatesSchema.optional(),
  sisIdentifiers: z
    .array(
      z.string().max(13, "Un identifiant SIS ne doit pas excéder 13 caractères")
    )
    .optional(),
  producerType: getActorTypeSchema("de producteur initial"),
  producerOrgId: getActorOrgIdSchema("du producteur initial"),
  producerName: getActorNameSchema("du producteur initial"),
  producerAddress: getActorAddressSchema("du producteur initial"),
  producerPostalCode: getActorPostalCodeSchema("du producteur initial"),
  producerCity: getActorCitySchema("du producteur initial"),
  producerCountryCode: getActorCountryCodeSchema("du producteur initial"),
  municipalitiesInseeCodes: inseeCodesSchema,
  municipalitiesNames: municipalitiesNamesSchema,
  senderType: getActorTypeSchema("d'expéditeur ou détenteur"),
  senderOrgId: getActorOrgIdSchema("d'expéditeur ou détenteur"),
  senderName: getActorNameSchema("d'expéditeur ou détenteur'"),
  senderAddress: getActorAddressSchema("d'expéditeur ou détenteur"),
  senderPostalCode: getActorPostalCodeSchema("d'expéditeur ou détenteur"),
  senderCity: getActorCitySchema("d'expéditeur ou détenteur"),
  senderCountryCode: getActorCountryCodeSchema("d'expéditeur ou détenteur"),
  senderTakeOverAddress: getActorAddressSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).optional(),
  senderTakeOverPostalCode: getActorPostalCodeSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).optional(),
  senderTakeOverCity: getActorCitySchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).optional(),
  senderTakeOverCountryCode: getActorCountryCodeSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).optional(),
  brokerSiret: getActorSiretSchema("du courtier").optional(),
  brokerName: getActorNameSchema("du courtier").optional(),
  brokerReceiptNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du courtier ne doit pas excéder 150 caractères"
    )
    .optional(),
  traderSiret: getActorSiretSchema("du négociant").optional(),
  traderName: getActorNameSchema("du négociant").optional(),
  traderReceiptNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du négociant ne doit pas excéder 150 caractères"
    )
    .optional(),
  operationCode: operationCodeSchema,
  nextDestinationIsAbroad: nextDestinationIsAbroad.optional(),
  declarationNumber: declarationNumberSchema,
  notificationNumber: notificationNumberSchema,
  movementNumber: z.string().optional(),
  nextOperationCode: operationCodeSchema.optional(),
  isUpcycled: z.boolean().optional(),
  destinationParcelInseeCodes: inseeCodesSchema,
  destinationParcelNumbers: parcelNumbersSchema.optional(),
  destinationParcelCoordinates: parcelCoordinatesSchema.optional(),
  transporter1TransportMode: transportModeSchema,
  transporter1Type: getActorTypeSchema("de transporteur 1"),
  transporter1OrgId: getActorOrgIdSchema("du transporteur 1"),
  transporter1ReceiptNumber: transportReceiptNumberSchema,
  transporter1Name: getActorNameSchema("du transporteur 1"),
  transporter1Address: getActorAddressSchema("du transporteur 1"),
  transporter1PostalCode: getActorPostalCodeSchema("du transporteur 1"),
  transporter1City: getActorCitySchema("du transporteur 1"),
  transporter1CountryCode: getActorCountryCodeSchema("du transporteur 1"),
  transporter2TransportMode: transportModeSchema.optional(),
  transporter2Type: getActorTypeSchema("de transporteur 2").optional(),
  transporter2OrgId: getActorOrgIdSchema("du transporteur 2").optional(),
  transporter2ReceiptNumber: transportReceiptNumberSchema.optional(),
  transporter2Name: getActorNameSchema("du transporteur 2").optional(),
  transporter2Address: getActorAddressSchema("du transporteur 2").optional(),
  transporter2PostalCode:
    getActorPostalCodeSchema("du transporteur 2").optional(),
  transporter2City: getActorCitySchema("du transporteur 2").optional(),
  transporter2CountryCode:
    getActorCountryCodeSchema("du transporteur 2").optional(),
  transporter3TransportMode: transportModeSchema.optional(),
  transporter3Type: getActorTypeSchema("de transporteur 3").optional(),
  transporter3OrgId: getActorOrgIdSchema("du transporteur 3").optional(),
  transporter3ReceiptNumber: transportReceiptNumberSchema.optional(),
  transporter3Name: getActorNameSchema("du transporteur 3").optional(),
  transporter3Address: getActorAddressSchema("du transporteur 3").optional(),
  transporter3PostalCode:
    getActorPostalCodeSchema("du transporteur 3").optional(),
  transporter3City: getActorCitySchema("du transporteur 3").optional(),
  transporter3CountryCode:
    getActorCountryCodeSchema("du transporteur 3").optional(),
  transporter4TransportMode: transportModeSchema.optional(),
  transporter4Type: getActorTypeSchema("de transporteur 4").optional(),
  transporter4OrgId: getActorOrgIdSchema("du transporteur 4").optional(),
  transporter4ReceiptNumber: transportReceiptNumberSchema.optional(),
  transporter4Name: getActorNameSchema("du transporteur 4").optional(),
  transporter4Address: getActorAddressSchema("du transporteur 4").optional(),
  transporter4PostalCode:
    getActorPostalCodeSchema("du transporteur 4").optional(),
  transporter4City: getActorCitySchema("du transporteur 4").optional(),
  transporter4CountryCode:
    getActorCountryCodeSchema("du transporteur 4").optional(),
  transporter5TransportMode: transportModeSchema.optional(),
  transporter5Type: getActorTypeSchema("de transporteur 5").optional(),
  transporter5OrgId: getActorOrgIdSchema("du transporteur 5").optional(),
  transporter5ReceiptNumber: transportReceiptNumberSchema.optional(),
  transporter5Name: getActorNameSchema("du transporteur 5").optional(),
  transporter5Address: getActorAddressSchema("du transporteur 5").optional(),
  transporter5PostalCode:
    getActorPostalCodeSchema("du transporteur 5").optional(),
  transporter5City: getActorCitySchema("du transporteur 5").optional(),
  transporter5CountryCode:
    getActorCountryCodeSchema("du transporteur 5").optional()
});

// Props added through transform
const transformedIncomingTexsSchema = z.object({
  id: z.string().optional(),
  reportForAddress: z.string().default(""),
  reportForCity: z.string().default(""),
  reportForPostalCode: z.string().default(""),
  reportForName: z.coerce.string().default("")
});

export const incomingTexsSchema = inputIncomingTexsSchema.merge(
  transformedIncomingTexsSchema
);
