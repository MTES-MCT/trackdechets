import {
  Prisma,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import type {
  IncomingWasteV2,
  ManagedWasteV2,
  OutgoingWasteV2,
  TransportedWasteV2,
  AllWasteV2
} from "@td/codegen-back";
import { getWasteDescription } from "./utils";
import { getBsvhuSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import Decimal from "decimal.js";
import {
  emptyIncomingWasteV2,
  emptyManagedWasteV2,
  emptyOutgoingWasteV2,
  emptyTransportedWasteV2,
  emptyAllWasteV2,
  RegistryV2Bsvhu
} from "../registryV2/types";
import {
  createRegistryLogger,
  deleteRegistryLookup,
  generateDateInfos
} from "@td/registry";
import { logger } from "@td/logger";
import { BsvhuForElastic } from "./elastic";

export const toIncomingWasteV2 = (
  bsvhu: RegistryV2Bsvhu
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = bsvhu.emitterCompanyStreet &&
  bsvhu.emitterCompanyPostalCode &&
  bsvhu.emitterCompanyCity
    ? {
        street: bsvhu.emitterCompanyStreet,
        postalCode: bsvhu.emitterCompanyPostalCode,
        city: bsvhu.emitterCompanyCity,
        country: "FR"
      }
    : splitAddress(bsvhu.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsvhu.destinationCompanyAddress);
  return {
    ...emptyIncomingWasteV2,
    id: bsvhu.id,
    source: "BSD",
    publicId: null,
    bsdId: bsvhu.id,
    reportAsSiret: null,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.updatedAt,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsvhu.destinationOperationDate,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    customId: bsvhu.customId,
    status: bsvhu.status,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: bsvhu.quantity,
    wasteContainsElectricOrHybridVehicles:
      bsvhu.containsElectricOrHybridVehicles,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    emitterCompanyType: null,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    ecoOrganismeName: bsvhu.ecoOrganismeName,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderCompanyMail: bsvhu.traderCompanyMail,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerCompanyMail: bsvhu.brokerCompanyMail,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    isDirectSupply: false,
    transporter1CompanyName: bsvhu.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret:
      bsvhu.transporterCompanySiret ?? bsvhu.transporterCompanyVatNumber,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporter1TransportMode: null,
    transporter1CompanyMail: bsvhu.transporterCompanyMail,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    destinationReceptionRefusedWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionWeightIsEstimate: false,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationOperationCodes: bsvhu.destinationOperationCode
      ? [bsvhu.destinationOperationCode]
      : null,
    destinationOperationModes: bsvhu.destinationOperationMode
      ? [bsvhu.destinationOperationMode]
      : null,
    destinationOperationNoTraceability: false
  };
};

export const toOutgoingWasteV2 = (
  bsvhu: RegistryV2Bsvhu
): Omit<Required<OutgoingWasteV2>, "__typename"> => {
  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = bsvhu.emitterCompanyStreet &&
  bsvhu.emitterCompanyPostalCode &&
  bsvhu.emitterCompanyCity
    ? {
        street: bsvhu.emitterCompanyStreet,
        postalCode: bsvhu.emitterCompanyPostalCode,
        city: bsvhu.emitterCompanyCity,
        country: "FR"
      }
    : splitAddress(bsvhu.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsvhu.destinationCompanyAddress);
  return {
    ...emptyOutgoingWasteV2,
    id: bsvhu.id,
    source: "BSD",
    publicId: null,
    bsdId: bsvhu.id,
    reportAsSiret: null,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.updatedAt,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationOperationDate: bsvhu.destinationOperationDate,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    customId: bsvhu.customId,
    status: bsvhu.status,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: bsvhu.quantity,
    wasteContainsElectricOrHybridVehicles:
      bsvhu.containsElectricOrHybridVehicles,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    weightIsEstimate: bsvhu.weightIsEstimate,
    volume: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    emitterCompanyType: null,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    emitterPickupsiteName: null,
    emitterPickupsiteAddress: null,
    emitterPickupsitePostalCode: null,
    emitterPickupsiteCity: null,
    emitterPickupsiteCountry: null,
    workerCompanySiret: null,
    workerCompanyName: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    ecoOrganismeName: bsvhu.ecoOrganismeName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanyMail: bsvhu.brokerCompanyMail,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanyMail: bsvhu.traderCompanyMail,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    isDirectSupply: false,
    transporter1CompanySiret:
      bsvhu.transporterCompanySiret ?? bsvhu.transporterCompanyVatNumber,
    transporter1CompanyName: bsvhu.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporter1TransportMode: null,
    transporter1CompanyMail: bsvhu.transporterCompanyMail,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,
    postTempStorageDestinationSiret: null,
    postTempStorageDestinationName: null,
    postTempStorageDestinationAddress: null,
    postTempStorageDestinationPostalCode: null,
    postTempStorageDestinationCity: null,
    postTempStorageDestinationCountry: null,

    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: null,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsvhu.destinationOperationCode
      ? [bsvhu.destinationOperationCode]
      : null,
    destinationOperationModes: bsvhu.destinationOperationMode
      ? [bsvhu.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes: null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets: null,
    destinationFinalOperationCodes: null,
    destinationFinalOperationWeights: null,
    gistridNumber: null,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const toTransportedWasteV2 = (
  bsvhu: RegistryV2Bsvhu
): Omit<Required<TransportedWasteV2>, "__typename"> => {
  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = bsvhu.emitterCompanyStreet &&
  bsvhu.emitterCompanyPostalCode &&
  bsvhu.emitterCompanyCity
    ? {
        street: bsvhu.emitterCompanyStreet,
        postalCode: bsvhu.emitterCompanyPostalCode,
        city: bsvhu.emitterCompanyCity,
        country: "FR"
      }
    : splitAddress(bsvhu.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsvhu.destinationCompanyAddress);

  return {
    ...emptyTransportedWasteV2,
    id: bsvhu.id,
    source: "BSD",
    publicId: null,
    bsdId: bsvhu.id,
    reportAsSiret: null,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.updatedAt,
    transporterTakenOverAt:
      bsvhu.transporterTransportTakenOverAt ??
      bsvhu.transporterTransportSignatureDate,
    unloadingDate: null,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    customId: bsvhu.customId,
    status: bsvhu.status,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    quantity: bsvhu.quantity,
    wasteContainsElectricOrHybridVehicles:
      bsvhu.containsElectricOrHybridVehicles,
    weightIsEstimate: bsvhu.weightIsEstimate,
    volume: null,

    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,

    emitterPickupsiteName: null,
    emitterPickupsiteAddress: null,
    emitterPickupsitePostalCode: null,
    emitterPickupsiteCity: null,
    emitterPickupsiteCountry: null,

    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,

    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    ecoOrganismeName: bsvhu.ecoOrganismeName,

    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    brokerCompanyMail: bsvhu.brokerCompanyMail,

    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    traderCompanyMail: bsvhu.traderCompanyMail,

    transporter1CompanySiret:
      bsvhu.transporterCompanySiret ?? bsvhu.transporterCompanyVatNumber,
    transporter1CompanyName: bsvhu.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporter1TransportMode: null,
    transporter1CompanyMail: bsvhu.transporterCompanyMail,
    transporter1TransportPlates: bsvhu.transporterTransportPlates,

    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,

    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsvhu.destinationCompanyMail,

    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,

    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: null,
    destinationHasCiterneBeenWashedOut: null,

    gistridNumber: null,
    movementNumber: null
  };
};

export const toManagedWasteV2 = (
  bsvhu: RegistryV2Bsvhu,
  targetSiret: string
): Omit<Required<ManagedWasteV2>, "__typename"> => {
  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = bsvhu.emitterCompanyStreet &&
  bsvhu.emitterCompanyPostalCode &&
  bsvhu.emitterCompanyCity
    ? {
        street: bsvhu.emitterCompanyStreet,
        postalCode: bsvhu.emitterCompanyPostalCode,
        city: bsvhu.emitterCompanyCity,
        country: "FR"
      }
    : splitAddress(bsvhu.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsvhu.destinationCompanyAddress);
  return {
    ...emptyManagedWasteV2,
    id: bsvhu.id,
    source: "BSD",
    publicId: null,
    bsdId: bsvhu.id,
    reportAsSiret: null,
    reportForSiret: targetSiret,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.updatedAt,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationOperationDate: bsvhu.destinationOperationDate,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    customId: bsvhu.customId,
    status: bsvhu.status,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: bsvhu.quantity,
    wasteContainsElectricOrHybridVehicles:
      bsvhu.containsElectricOrHybridVehicles,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    weightIsEstimate: bsvhu.weightIsEstimate,
    volume: null,
    managingStartDate: null,
    managingEndDate: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    emitterCompanyType: null,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    emitterPickupsiteName: null,
    emitterPickupsiteAddress: null,
    emitterPickupsitePostalCode: null,
    emitterPickupsiteCity: null,
    emitterPickupsiteCountry: null,
    tempStorerCompanyOrgId: null,
    tempStorerCompanyName: null,
    tempStorerCompanyAddress: null,
    tempStorerCompanyPostalCode: null,
    tempStorerCompanyCity: null,
    tempStorerCompanyCountryCode: null,
    workerCompanySiret: null,
    workerCompanyName: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    ecoOrganismeName: bsvhu.ecoOrganismeName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanyMail: bsvhu.brokerCompanyMail,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanyMail: bsvhu.traderCompanyMail,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    isDirectSupply: false,
    transporter1CompanySiret:
      bsvhu.transporterCompanySiret ?? bsvhu.transporterCompanyVatNumber,
    transporter1CompanyName: bsvhu.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporter1TransportMode: null,
    transporter1CompanyMail: bsvhu.transporterCompanyMail,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,

    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: null,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsvhu.destinationOperationCode
      ? [bsvhu.destinationOperationCode]
      : null,
    destinationOperationModes: bsvhu.destinationOperationMode
      ? [bsvhu.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes: null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets: null,
    destinationFinalOperationCodes: null,
    destinationFinalOperationWeights: null,
    gistridNumber: null,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const toAllWasteV2 = (
  bsvhu: RegistryV2Bsvhu
): Omit<Required<AllWasteV2>, "__typename"> => {
  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = bsvhu.emitterCompanyStreet &&
  bsvhu.emitterCompanyPostalCode &&
  bsvhu.emitterCompanyCity
    ? {
        street: bsvhu.emitterCompanyStreet,
        postalCode: bsvhu.emitterCompanyPostalCode,
        city: bsvhu.emitterCompanyCity,
        country: "FR"
      }
    : splitAddress(bsvhu.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsvhu.destinationCompanyAddress);
  return {
    ...emptyAllWasteV2,
    id: bsvhu.id,
    bsdId: bsvhu.id,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.updatedAt,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    destinationOperationDate: bsvhu.destinationOperationDate,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    customId: bsvhu.customId,
    status: bsvhu.status,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: bsvhu.quantity,
    wasteContainsElectricOrHybridVehicles:
      bsvhu.containsElectricOrHybridVehicles,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    weightIsEstimate: bsvhu.weightIsEstimate,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    emitterCompanyType: null,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    emitterPickupsiteName: null,
    emitterPickupsiteAddress: null,
    emitterPickupsitePostalCode: null,
    emitterPickupsiteCity: null,
    emitterPickupsiteCountry: null,
    workerCompanySiret: null,
    workerCompanyName: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    ecoOrganismeName: bsvhu.ecoOrganismeName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanyMail: bsvhu.brokerCompanyMail,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanyMail: bsvhu.traderCompanyMail,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    intermediary1CompanySiret: bsvhu.intermediaries?.[0]?.siret,
    intermediary1CompanyName: bsvhu.intermediaries?.[0]?.name,
    intermediary2CompanySiret: bsvhu.intermediaries?.[1]?.siret,
    intermediary2CompanyName: bsvhu.intermediaries?.[1]?.name,
    intermediary3CompanySiret: bsvhu.intermediaries?.[2]?.siret,
    intermediary3CompanyName: bsvhu.intermediaries?.[2]?.name,
    isDirectSupply: false,
    transporter1CompanySiret:
      bsvhu.transporterCompanySiret ?? bsvhu.transporterCompanyVatNumber,
    transporter1CompanyName: bsvhu.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporter1TransportMode: null,
    transporter1UnloadingDate: null,
    transporter1TransportPlates: bsvhu.transporterTransportPlates,
    transporter1CompanyMail: bsvhu.transporterCompanyMail,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    postTempStorageDestinationSiret: null,
    postTempStorageDestinationName: null,
    postTempStorageDestinationAddress: null,
    postTempStorageDestinationPostalCode: null,
    postTempStorageDestinationCity: null,
    postTempStorageDestinationCountry: null,

    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: null,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsvhu.destinationOperationCode
      ? [bsvhu.destinationOperationCode]
      : null,
    destinationOperationModes: bsvhu.destinationOperationMode
      ? [bsvhu.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes: null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets: null,
    destinationFinalOperationCodes: null,
    destinationFinalOperationWeights: null,
    gistridNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const getElasticExhaustiveRegistryFields = (bsvhu: BsvhuForElastic) => {
  const registryFields: Record<"isExhaustiveWasteFor", string[]> = {
    isExhaustiveWasteFor: []
  };
  if (!bsvhu.isDraft) {
    registryFields.isExhaustiveWasteFor = [
      bsvhu.destinationCompanySiret,
      bsvhu.emitterCompanySiret,
      bsvhu.transporterCompanySiret,
      bsvhu.ecoOrganismeSiret,
      bsvhu.brokerCompanySiret,
      bsvhu.traderCompanySiret
    ].filter(Boolean);
    if (bsvhu.intermediaries?.length) {
      for (const intermediary of bsvhu.intermediaries) {
        const intermediaryOrgId = intermediary.siret ?? intermediary.vatNumber;
        if (intermediaryOrgId) {
          registryFields.isExhaustiveWasteFor.push(intermediaryOrgId);
        }
      }
    }
  }
  return registryFields;
};

const minimalBsvhuForLookupSelect = {
  id: true,
  createdAt: true,
  destinationOperationSignatureDate: true,
  destinationReceptionDate: true,
  destinationCompanySiret: true,
  transporterTransportSignatureDate: true,
  transporterTransportTakenOverAt: true,
  transporterCompanySiret: true,
  transporterCompanyVatNumber: true,
  emitterCompanySiret: true,
  ecoOrganismeSiret: true,
  brokerCompanySiret: true,
  traderCompanySiret: true,
  wasteCode: true,
  intermediaries: {
    select: {
      siret: true,
      vatNumber: true
    }
  }
};

type MinimalBsvhuForLookup = Prisma.BsvhuGetPayload<{
  select: typeof minimalBsvhuForLookupSelect;
}>;

const bsvhuToLookupCreateInputs = (
  bsvhu: MinimalBsvhuForLookup
): Prisma.RegistryLookupUncheckedCreateInput[] => {
  const res: Prisma.RegistryLookupUncheckedCreateInput[] = [];
  if (
    bsvhu.destinationOperationSignatureDate &&
    bsvhu.destinationCompanySiret
  ) {
    res.push({
      id: bsvhu.id,
      readableId: bsvhu.id,
      siret: bsvhu.destinationCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsvhu.wasteCode,
      ...generateDateInfos(
        bsvhu.destinationReceptionDate ??
          bsvhu.destinationOperationSignatureDate,
        bsvhu.createdAt
      ),
      bsvhuId: bsvhu.id
    });
  }
  if (bsvhu.transporterTransportSignatureDate) {
    const outgoingSirets = new Set([
      bsvhu.emitterCompanySiret,
      bsvhu.ecoOrganismeSiret
    ]);
    outgoingSirets.forEach(siret => {
      if (!siret) {
        return;
      }
      res.push({
        id: bsvhu.id,
        readableId: bsvhu.id,
        siret,
        exportRegistryType: RegistryExportType.OUTGOING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsvhu.wasteCode,
        ...generateDateInfos(
          bsvhu.transporterTransportTakenOverAt ??
            bsvhu.transporterTransportSignatureDate!,
          bsvhu.createdAt
        ),
        bsvhuId: bsvhu.id
      });
    });
    const transporterCompanyOrgId =
      bsvhu.transporterCompanySiret ?? bsvhu.transporterCompanyVatNumber;
    if (transporterCompanyOrgId) {
      res.push({
        id: bsvhu.id,
        readableId: bsvhu.id,
        siret: transporterCompanyOrgId,
        exportRegistryType: RegistryExportType.TRANSPORTED,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsvhu.wasteCode,
        ...generateDateInfos(
          bsvhu.transporterTransportTakenOverAt ??
            bsvhu.transporterTransportSignatureDate!,
          bsvhu.createdAt
        ),
        bsvhuId: bsvhu.id
      });
    }
    const managedSirets = new Set([
      bsvhu.brokerCompanySiret,
      bsvhu.traderCompanySiret
    ]);
    bsvhu.intermediaries?.forEach(intermediary => {
      const intermediaryOrgId = intermediary.siret ?? intermediary.vatNumber;
      if (intermediaryOrgId) {
        managedSirets.add(intermediaryOrgId);
      }
    });
    managedSirets.forEach(siret => {
      if (!siret) {
        return;
      }
      res.push({
        id: bsvhu.id,
        readableId: bsvhu.id,
        siret,
        exportRegistryType: RegistryExportType.MANAGED,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsvhu.wasteCode,
        ...generateDateInfos(
          bsvhu.transporterTransportTakenOverAt ??
            bsvhu.transporterTransportSignatureDate!,
          bsvhu.createdAt
        ),
        bsvhuId: bsvhu.id
      });
    });
  }
  return res;
};

export const updateRegistryLookup = async (
  bsvhu: MinimalBsvhuForLookup
): Promise<void> => {
  await prisma.$transaction(async tx => {
    // acquire an advisory lock on the bsvhu id
    // see more explanation in bsda/registryV2.ts
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${bsvhu.id}, 0))`;

    await deleteRegistryLookup(bsvhu.id, tx);
    const lookupInputs = bsvhuToLookupCreateInputs(bsvhu);
    if (lookupInputs.length > 0) {
      try {
        await tx.registryLookup.createMany({
          data: lookupInputs
        });
      } catch (error) {
        logger.error(`Error creating registry lookup for bsvhu ${bsvhu.id}`);
        logger.error(lookupInputs);
        throw error;
      }
    }
  });
};

export const rebuildRegistryLookup = async (pageSize = 100, threads = 4) => {
  const logger = createRegistryLogger("BSVHU");

  const total = await prisma.bsvhu.count({
    where: {
      isDeleted: false,
      isDraft: false
    }
  });

  let done = false;
  let cursorId: string | null = null;
  let processedCount = 0;
  let operationId = 0;
  const pendingWrites = new Map<number, Promise<void>>();

  const processWrite = async (items: MinimalBsvhuForLookup[]) => {
    let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
    for (const bsvhu of items) {
      const createInputs = bsvhuToLookupCreateInputs(bsvhu);
      createArray = createArray.concat(createInputs);
    }
    // Run delete and create operations in a transaction
    await prisma.$transaction(
      async tx => {
        // Delete existing lookups for these items
        await tx.registryLookup.deleteMany({
          where: {
            OR: items.map(item => ({
              id: item.id
            }))
          }
        });
        await tx.registryLookup.createMany({
          data: createArray,
          skipDuplicates: true
        });
      },
      {
        maxWait: 20000,
        timeout: 60000
      }
    );
    processedCount += items.length;
    logger.logProgress(processedCount, total, pendingWrites.size);
  };

  while (!done) {
    // Sequential read
    const items = await prisma.bsvhu.findMany({
      where: {
        isDeleted: false,
        isDraft: false
      },
      take: pageSize,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      },
      select: minimalBsvhuForLookupSelect
    });

    // Start the write operation
    const currentOperationId = operationId++;
    const writePromise = processWrite(items).finally(() => {
      pendingWrites.delete(currentOperationId);
    });
    pendingWrites.set(currentOperationId, writePromise);

    // If we've reached max concurrency, wait for one write to complete
    if (pendingWrites.size >= threads) {
      await Promise.race(pendingWrites.values());
    }

    if (items.length < pageSize) {
      done = true;
      break;
    }
    cursorId = items[items.length - 1].id;
  }

  // Wait for any remaining writes to complete
  if (pendingWrites.size > 0) {
    await Promise.all(pendingWrites.values());
  }

  logger.logCompletion(processedCount);
};

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
