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
  nextDestinationIsAbroad,
  noTraceability
} from "../../shared/schemas";

export type ParsedZodIncomingTexsItem = z.output<typeof incomingTexsSchema>;

const inputIncomingTexsSchema = z.object({
  reason: reasonSchema,
  customInfo: z.string().nullish(),
  publicId: publicIdSchema,
  reportAsSiret: reportAsSiretSchema,
  reportForSiret: getReportForSiretSchema("du destinataire"),
  wasteCode: wasteCodeSchema,
  wastePop: wastePopSchema,
  wasteIsDangerous: wasteIsDangerousSchema,
  receptionDate: receptionDateSchema,
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  dap: z.string().max(50, "Le DAP ne doit pas excéder 50 caractères").nullish(),
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
  ).nullish(),
  senderTakeOverPostalCode: getActorPostalCodeSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).nullish(),
  senderTakeOverCity: getActorCitySchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).nullish(),
  senderTakeOverCountryCode: getActorCountryCodeSchema(
    "de prise en charge de l'expéditeur ou détenteur"
  ).nullish(),
  brokerSiret: getActorSiretSchema("du courtier").nullish(),
  brokerName: getActorNameSchema("du courtier").nullish(),
  brokerReceiptNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du courtier ne doit pas excéder 150 caractères"
    )
    .nullish(),
  traderSiret: getActorSiretSchema("du négociant").nullish(),
  traderName: getActorNameSchema("du négociant").nullish(),
  traderReceiptNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du négociant ne doit pas excéder 150 caractères"
    )
    .nullish(),
  operationCode: operationCodeSchema,
  noTraceability: noTraceability.nullish(),
  nextDestinationIsAbroad: nextDestinationIsAbroad.nullish(),
  declarationNumber: declarationNumberSchema,
  notificationNumber: notificationNumberSchema,
  movementNumber: z.string().nullish(),
  nextOperationCode: operationCodeSchema.nullish(),
  isUpcycled: z.boolean().nullish(),
  destinationParcelInseeCodes: inseeCodesSchema,
  destinationParcelNumbers: parcelNumbersSchema,
  destinationParcelCoordinates: parcelCoordinatesSchema,
  transporter1TransportMode: transportModeSchema,
  transporter1Type: getActorTypeSchema("de transporteur 1"),
  transporter1OrgId: getActorOrgIdSchema("du transporteur 1"),
  transporter1ReceiptNumber: transportReceiptNumberSchema,
  transporter1Name: getActorNameSchema("du transporteur 1"),
  transporter1Address: getActorAddressSchema("du transporteur 1"),
  transporter1PostalCode: getActorPostalCodeSchema("du transporteur 1"),
  transporter1City: getActorCitySchema("du transporteur 1"),
  transporter1CountryCode: getActorCountryCodeSchema("du transporteur 1"),
  transporter2TransportMode: transportModeSchema.nullish(),
  transporter2Type: getActorTypeSchema("de transporteur 2").nullish(),
  transporter2OrgId: getActorOrgIdSchema("du transporteur 2").nullish(),
  transporter2ReceiptNumber: transportReceiptNumberSchema.nullish(),
  transporter2Name: getActorNameSchema("du transporteur 2").nullish(),
  transporter2Address: getActorAddressSchema("du transporteur 2").nullish(),
  transporter2PostalCode:
    getActorPostalCodeSchema("du transporteur 2").nullish(),
  transporter2City: getActorCitySchema("du transporteur 2").nullish(),
  transporter2CountryCode:
    getActorCountryCodeSchema("du transporteur 2").nullish(),
  transporter3TransportMode: transportModeSchema.nullish(),
  transporter3Type: getActorTypeSchema("de transporteur 3").nullish(),
  transporter3OrgId: getActorOrgIdSchema("du transporteur 3").nullish(),
  transporter3ReceiptNumber: transportReceiptNumberSchema.nullish(),
  transporter3Name: getActorNameSchema("du transporteur 3").nullish(),
  transporter3Address: getActorAddressSchema("du transporteur 3").nullish(),
  transporter3PostalCode:
    getActorPostalCodeSchema("du transporteur 3").nullish(),
  transporter3City: getActorCitySchema("du transporteur 3").nullish(),
  transporter3CountryCode:
    getActorCountryCodeSchema("du transporteur 3").nullish(),
  transporter4TransportMode: transportModeSchema.nullish(),
  transporter4Type: getActorTypeSchema("de transporteur 4").nullish(),
  transporter4OrgId: getActorOrgIdSchema("du transporteur 4").nullish(),
  transporter4ReceiptNumber: transportReceiptNumberSchema.nullish(),
  transporter4Name: getActorNameSchema("du transporteur 4").nullish(),
  transporter4Address: getActorAddressSchema("du transporteur 4").nullish(),
  transporter4PostalCode:
    getActorPostalCodeSchema("du transporteur 4").nullish(),
  transporter4City: getActorCitySchema("du transporteur 4").nullish(),
  transporter4CountryCode:
    getActorCountryCodeSchema("du transporteur 4").nullish(),
  transporter5TransportMode: transportModeSchema.nullish(),
  transporter5Type: getActorTypeSchema("de transporteur 5").nullish(),
  transporter5OrgId: getActorOrgIdSchema("du transporteur 5").nullish(),
  transporter5ReceiptNumber: transportReceiptNumberSchema.nullish(),
  transporter5Name: getActorNameSchema("du transporteur 5").nullish(),
  transporter5Address: getActorAddressSchema("du transporteur 5").nullish(),
  transporter5PostalCode:
    getActorPostalCodeSchema("du transporteur 5").nullish(),
  transporter5City: getActorCitySchema("du transporteur 5").nullish(),
  transporter5CountryCode:
    getActorCountryCodeSchema("du transporteur 5").nullish()
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
