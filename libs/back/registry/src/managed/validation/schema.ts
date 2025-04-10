import { z } from "@td/validation";
import {
  reasonSchema,
  publicIdSchema,
  reportAsCompanySiretSchema,
  siretSchema,
  getWasteCodeSchema,
  booleanSchema,
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
  gistridNumberSchema,
  getOperationCodeSchema,
  operationModeSchema,
  actorSiretSchema,
  transportModeSchema,
  transportRecepisseNumberSchema,
  dateSchema,
  inseeCodesSchema,
  parcelNumbersSchema,
  parcelCoordinatesSchema
} from "../../shared/schemas";

export type ParsedZodInputManagedItem = z.output<typeof inputManagedSchema>;
export type ParsedZodManagedItem = z.output<typeof managedSchema>;

const inputManagedSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: siretSchema,
  wasteCode: getWasteCodeSchema().nullish(),
  wastePop: booleanSchema,
  wasteIsDangerous: booleanSchema.nullish(),
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  managingStartDate: dateSchema,
  managingEndDate: dateSchema,
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  wasteDap: z
    .string()
    .trim()
    .max(50, "Le DAP ne doit pas excéder 50 caractères")
    .nullish(),
  initialEmitterCompanyType: actorTypeSchema.nullish(),
  initialEmitterCompanyOrgId: actorOrgIdSchema.nullish(),
  initialEmitterCompanyName: actorNameSchema.nullish(),
  initialEmitterCompanyAddress: actorAddressSchema.nullish(),
  initialEmitterCompanyPostalCode: actorPostalCodeSchema.nullish(),
  initialEmitterCompanyCity: actorCitySchema.nullish(),
  initialEmitterCompanyCountryCode: actorCountryCodeSchema.nullish(),
  initialEmitterMunicipalitiesInseeCodes: inseeCodesSchema,
  parcelInseeCodes: inseeCodesSchema,
  parcelNumbers: parcelNumbersSchema,
  parcelCoordinates: parcelCoordinatesSchema,
  sisIdentifier: z
    .string()
    .trim()
    .max(13, "Un identifiant SIS ne doit pas excéder 13 caractères")
    .nullish(),
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
  operationCode: getOperationCodeSchema(),
  operationMode: operationModeSchema,
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
  tempStorerCompanyType: actorTypeSchema.exclude(["COMMUNES"]).nullish(),
  tempStorerCompanyOrgId: actorOrgIdSchema.nullish(),
  tempStorerCompanyName: actorNameSchema.nullish(),
  tempStorerCompanyAddress: actorAddressSchema.nullish(),
  tempStorerCompanyPostalCode: actorPostalCodeSchema.nullish(),
  tempStorerCompanyCity: actorCitySchema.nullish(),
  tempStorerCompanyCountryCode: actorCountryCodeSchema.nullish(),
  isUpcycled: booleanSchema.nullish(),
  destinationParcelInseeCodes: inseeCodesSchema,
  destinationParcelNumbers: parcelNumbersSchema,
  destinationParcelCoordinates: parcelCoordinatesSchema,
  ecoOrganismeSiret: actorSiretSchema.nullish(),
  ecoOrganismeName: actorNameSchema.nullish(),
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
const transformedManagedïSchema = z.object({
  id: z.string().optional(),
  reportForCompanyAddress: z.string().default(""),
  reportForCompanyCity: z.string().default(""),
  reportForCompanyPostalCode: z.string().default(""),
  reportForCompanyName: z.coerce.string().default("")
});

export const managedSchema = inputManagedSchema.merge(
  transformedManagedïSchema
);
