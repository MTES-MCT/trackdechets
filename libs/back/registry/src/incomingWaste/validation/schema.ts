import { z } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  reportAsSiretSchema,
  wasteCodeSchema,
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
  transportReceiptNumberSchema,
  operationCodeSchema,
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
  noTraceability
} from "../../shared/schemas";

export type ParsedZodIncomingWasteItem = z.output<typeof incomingWasteSchema>;

const inputIncomingWasteSchema = z.object({
  reason: reasonSchema,
  custominfo: z.string().nullish(),
  publicId: publicIdSchema,
  reportAsSiret: reportAsSiretSchema,
  reportForSiret: getReportForSiretSchema("du destinataire"),
  wasteCode: wasteCodeSchema,
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
  producerType: getActorTypeSchema("de producteur"),
  producerOrgId: getActorOrgIdSchema("du producteur"),
  producerName: getActorNameSchema("du producteur"),
  producerAddress: getActorAddressSchema("du producteur"),
  producerPostalCode: getActorPostalCodeSchema("du producteur"),
  producerCity: getActorCitySchema("du producteur"),
  producerCountryCode: getActorCountryCodeSchema("du producteur"),
  municipalitiesInseeCodes: inseeCodesSchema,
  municipalitiesNames: municipalitiesNamesSchema,
  senderType: getActorTypeSchema("d'expéditeur"),
  senderOrgId: getActorOrgIdSchema("d'expéditeur"),
  senderName: getActorNameSchema("d'expéditeur'"),
  senderAddress: getActorAddressSchema("d'expéditeur"),
  senderPostalCode: getActorPostalCodeSchema("d'expéditeur"),
  senderCity: getActorCitySchema("d'expéditeur"),
  senderCountryCode: getActorCountryCodeSchema("d'expéditeur"),
  senderTakeOverAddress: getActorAddressSchema(
    "de prise en charge de l'expéditeur"
  ).nullish(),
  senderTakeOverPostalCode: getActorPostalCodeSchema(
    "de prise en charge de l'expéditeur"
  ).nullish(),
  senderTakeOverCity: getActorCitySchema(
    "de prise en charge de l'expéditeur"
  ).nullish(),
  senderTakeOverCountryCode: getActorCountryCodeSchema(
    "de prise en charge de l'expéditeur"
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
  ecoOrganismeSiret: getActorSiretSchema("de l'éco-organisme").nullish(),
  ecoOrganismeName: getActorNameSchema("de l'éco-organisme").nullish(),
  operationCode: operationCodeSchema,
  noTraceability: noTraceability.nullish(),
  nextDestinationIsAbroad: nextDestinationIsAbroad.nullish(),
  declarationNumber: declarationNumberSchema,
  notificationNumber: notificationNumberSchema,
  movementNumber: z.string().nullish(),
  nextOperationCode: operationCodeSchema.nullish(),
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
const transformedIncomingWasteSchema = z.object({
  id: z.string().optional(),
  reportForAddress: z.string().default(""),
  reportForCity: z.string().default(""),
  reportForPostalCode: z.string().default(""),
  reportForName: z.coerce.string().default("")
});

export const incomingWasteSchema = inputIncomingWasteSchema.merge(
  transformedIncomingWasteSchema
);
