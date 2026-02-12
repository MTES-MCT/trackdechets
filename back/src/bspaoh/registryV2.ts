import {
  BspaohStatus,
  Prisma,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@td/prisma";
import { prisma } from "@td/prisma";
import {
  IncomingWasteV2,
  OutgoingWasteV2,
  TransportedWasteV2,
  AllWasteV2
} from "@td/codegen-back";
import { getTransporterCompanyOrgId } from "@td/constants";
import { getBspaohSubType } from "../common/subTypes";
import { getWasteDescription } from "./utils";
import { splitAddress } from "../common/addresses";
import { kgToTonRegistryV2 } from "../common/converter";
import { getFirstTransporterSync } from "./converter";
import {
  emptyIncomingWasteV2,
  emptyOutgoingWasteV2,
  RegistryV2Bspaoh,
  emptyTransportedWasteV2,
  emptyAllWasteV2
} from "../registryV2/types";
import {
  deleteRegistryLookup,
  generateDateInfos,
  rebuildRegistryLookupGeneric
} from "@td/registry";
import { logger } from "@td/logger";
import { BspaohForElastic } from "./elastic";

export const toIncomingWasteV2 = (
  bspaoh: RegistryV2Bspaoh
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bspaoh.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bspaoh.emitterCompanyAddress);

  const transporter = getFirstTransporterSync(bspaoh);
  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  return {
    ...emptyIncomingWasteV2,
    id: bspaoh.id,
    source: "BSD",
    publicId: null,
    bsdId: bspaoh.id,
    reportAsSiret: null,
    createdAt: bspaoh.createdAt,
    updatedAt: bspaoh.updatedAt,
    transporterTakenOverAt: bspaoh.transporterTransportTakenOverAt,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bspaoh.destinationOperationDate,
    bsdType: "BSPAOH",
    bsdSubType: getBspaohSubType(bspaoh),
    customId: null,
    status: bspaoh.status,
    wasteDescription: bspaoh.wasteCode
      ? getWasteDescription(bspaoh.wasteType)
      : "",
    wasteCode: bspaoh.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: kgToTonRegistryV2(bspaoh.emitterWasteWeightValue),
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: bspaoh.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bspaoh.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bspaoh.emitterPickupSiteCity,
    emitterPickupsiteCountry: bspaoh.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyMail: bspaoh.emitterCompanyMail,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeName: null,
    ecoOrganismeSiret: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerCompanyMail: null,
    brokerRecepisseNumber: null,
    isDirectSupply: false,
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted ?? null,
    transporter1RecepisseNumber:
      transporter?.transporterRecepisseNumber ?? null,
    transporter1TransportMode: transporter?.transporterTransportMode ?? null,
    transporter1CompanyMail: transporter?.transporterCompanyMail ?? null,
    wasteAdr: bspaoh.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: bspaoh.destinationCap,
    wasteDap: null,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bspaoh.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bspaoh.destinationReceptionAcceptationStatus,
    destinationReceptionWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteReceivedWeightValue),
    destinationReceptionRefusedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteRefusedWeightValue),
    destinationReceptionAcceptedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteAcceptedWeightValue),
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: null,
    destinationOperationCodes: bspaoh.destinationOperationCode
      ? [bspaoh.destinationOperationCode]
      : null,
    destinationOperationModes: ["ELIMINATION"],
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false
  };
};

export const toOutgoingWasteV2 = (
  bspaoh: RegistryV2Bspaoh
): Omit<Required<OutgoingWasteV2>, "__typename"> => {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bspaoh.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bspaoh.emitterCompanyAddress);

  const transporter = getFirstTransporterSync(bspaoh);
  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  return {
    ...emptyOutgoingWasteV2,
    id: bspaoh.id,
    source: "BSD",
    publicId: null,
    bsdId: bspaoh.id,
    reportAsSiret: null,
    createdAt: bspaoh.createdAt,
    updatedAt: bspaoh.updatedAt,
    transporterTakenOverAt: bspaoh.transporterTransportTakenOverAt,
    destinationOperationDate: bspaoh.destinationOperationDate,
    bsdType: "BSPAOH",
    bsdSubType: getBspaohSubType(bspaoh),
    customId: null,
    status: bspaoh.status,
    wasteDescription: bspaoh.wasteCode
      ? getWasteDescription(bspaoh.wasteType)
      : "",
    wasteCode: bspaoh.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: kgToTonRegistryV2(bspaoh.emitterWasteWeightValue),
    weightIsEstimate: bspaoh.emitterWasteWeightIsEstimate,
    volume: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bspaoh.emitterCompanyMail,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: bspaoh.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bspaoh.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bspaoh.emitterPickupSiteCity,
    emitterPickupsiteCountry: bspaoh.emitterPickupSiteAddress ? "FR" : null,
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
    ecoOrganismeName: null,
    ecoOrganismeSiret: null,
    brokerCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanyMail: null,
    brokerRecepisseNumber: null,
    traderCompanySiret: null,
    traderCompanyName: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    isDirectSupply: false,
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted ?? null,
    transporter1RecepisseNumber:
      transporter?.transporterRecepisseNumber ?? null,
    transporter1TransportMode: transporter?.transporterTransportMode ?? null,
    transporter1CompanyMail: transporter?.transporterCompanyMail ?? null,
    wasteAdr: bspaoh.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: bspaoh.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bspaoh.destinationCompanyMail,
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
      bspaoh.destinationReceptionAcceptationStatus,
    destinationReceptionWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteReceivedWeightValue),
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionAcceptedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteAcceptedWeightValue),
    destinationReceptionRefusedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteRefusedWeightValue),
    destinationPlannedOperationCode: null,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bspaoh.destinationOperationCode
      ? [bspaoh.destinationOperationCode]
      : null,
    destinationOperationModes: ["ELIMINATION"],
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
  bspaoh: RegistryV2Bspaoh
): Omit<Required<TransportedWasteV2>, "__typename"> | null => {
  const transporter = getFirstTransporterSync(bspaoh);
  const transporterTakenOverAt =
    bspaoh.transporterTransportTakenOverAt ??
    transporter?.transporterTransportSignatureDate;
  if (!transporterTakenOverAt) {
    return null;
  }

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bspaoh.emitterCompanyAddress);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bspaoh.destinationCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  return {
    ...emptyTransportedWasteV2,
    id: bspaoh.id,
    source: "BSD",
    publicId: null,
    bsdId: bspaoh.id,
    reportAsSiret: null,
    createdAt: bspaoh.createdAt,
    updatedAt: bspaoh.updatedAt,
    transporterTakenOverAt,
    unloadingDate: null,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    bsdType: "BSPAOH",
    bsdSubType: getBspaohSubType(bspaoh),
    customId: null,
    status: bspaoh.status,
    wasteDescription: bspaoh.wasteCode
      ? getWasteDescription(bspaoh.wasteType)
      : "",
    wasteCode: bspaoh.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: kgToTonRegistryV2(bspaoh.emitterWasteWeightValue),
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weightIsEstimate: bspaoh.emitterWasteWeightIsEstimate,
    volume: null,

    emitterCompanyIrregularSituation: null,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bspaoh.emitterCompanyMail,

    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: bspaoh.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bspaoh.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bspaoh.emitterPickupSiteCity,
    emitterPickupsiteCountry: bspaoh.emitterPickupSiteAddress ? "FR" : null,

    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,

    ecoOrganismeSiret: null,
    ecoOrganismeName: null,

    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    brokerCompanyMail: null,

    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    traderCompanyMail: null,

    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted ?? null,
    transporter1RecepisseNumber:
      transporter?.transporterRecepisseNumber ?? null,
    transporter1TransportMode: transporter?.transporterTransportMode ?? null,
    transporter1CompanyMail: transporter?.transporterCompanyMail ?? null,
    transporter1TransportPlates:
      transporter?.transporterTransportPlates ?? null,

    wasteAdr: bspaoh.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: bspaoh.destinationCap,

    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bspaoh.destinationCompanyMail,

    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,

    destinationReceptionAcceptationStatus:
      bspaoh.destinationReceptionAcceptationStatus,
    destinationReceptionWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteReceivedWeightValue),
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionAcceptedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteAcceptedWeightValue),
    destinationReceptionRefusedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteRefusedWeightValue),
    destinationHasCiterneBeenWashedOut: null,

    gistridNumber: null,
    movementNumber: null
  };
};

export const toAllWasteV2 = (
  bspaoh: RegistryV2Bspaoh
): Omit<Required<AllWasteV2>, "__typename"> => {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bspaoh.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bspaoh.emitterCompanyAddress);

  const transporter = getFirstTransporterSync(bspaoh);
  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  return {
    ...emptyAllWasteV2,
    id: bspaoh.id,
    bsdId: bspaoh.id,
    createdAt: bspaoh.createdAt,
    updatedAt: bspaoh.updatedAt,
    transporterTakenOverAt: bspaoh.transporterTransportTakenOverAt,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    destinationOperationDate: bspaoh.destinationOperationDate,
    bsdType: "BSPAOH",
    bsdSubType: getBspaohSubType(bspaoh),
    customId: null,
    status: bspaoh.status,
    wasteDescription: bspaoh.wasteCode
      ? getWasteDescription(bspaoh.wasteType)
      : "",
    wasteCode: bspaoh.wasteCode,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: kgToTonRegistryV2(bspaoh.emitterWasteWeightValue),
    weightIsEstimate: bspaoh.emitterWasteWeightIsEstimate,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bspaoh.emitterCompanyMail,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: bspaoh.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bspaoh.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bspaoh.emitterPickupSiteCity,
    emitterPickupsiteCountry: bspaoh.emitterPickupSiteAddress ? "FR" : null,
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
    ecoOrganismeName: null,
    ecoOrganismeSiret: null,
    brokerCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanyMail: null,
    brokerRecepisseNumber: null,
    traderCompanySiret: null,
    traderCompanyName: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    isDirectSupply: false,
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted ?? null,
    transporter1RecepisseNumber:
      transporter?.transporterRecepisseNumber ?? null,
    transporter1TransportMode: transporter?.transporterTransportMode ?? null,
    transporter1UnloadingDate: null,
    transporter1TransportPlates:
      transporter?.transporterTransportPlates ?? null,
    transporter1CompanyMail: transporter?.transporterCompanyMail ?? null,
    wasteAdr: bspaoh.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: bspaoh.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bspaoh.destinationCompanyMail,
    postTempStorageDestinationSiret: null,
    postTempStorageDestinationName: null,
    postTempStorageDestinationAddress: null,
    postTempStorageDestinationPostalCode: null,
    postTempStorageDestinationCity: null,
    postTempStorageDestinationCountry: null,

    destinationReceptionAcceptationStatus:
      bspaoh.destinationReceptionAcceptationStatus,
    destinationReceptionWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteReceivedWeightValue),
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionAcceptedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteAcceptedWeightValue),
    destinationReceptionRefusedWeight:
      kgToTonRegistryV2(bspaoh.destinationReceptionWasteRefusedWeightValue),
    destinationPlannedOperationCode: null,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bspaoh.destinationOperationCode
      ? [bspaoh.destinationOperationCode]
      : null,
    destinationOperationModes: ["ELIMINATION"],
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

export const getElasticExhaustiveRegistryFields = (
  bspaoh: BspaohForElastic
) => {
  const registryFields: Record<"isExhaustiveWasteFor", string[]> = {
    isExhaustiveWasteFor: []
  };
  if (bspaoh.status !== BspaohStatus.DRAFT) {
    registryFields.isExhaustiveWasteFor = [
      bspaoh.destinationCompanySiret,
      bspaoh.emitterCompanySiret
    ].filter(Boolean);
    if (bspaoh.transporters?.length) {
      for (const transporter of bspaoh.transporters) {
        const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
        if (transporterCompanyOrgId) {
          registryFields.isExhaustiveWasteFor.push(transporterCompanyOrgId);
        }
      }
    }
  }
  return registryFields;
};

const minimalBspaohForLookupSelect = {
  id: true,
  createdAt: true,
  destinationReceptionSignatureDate: true,
  destinationReceptionDate: true,
  destinationCompanySiret: true,
  emitterCompanySiret: true,
  wasteCode: true,
  transporterTransportTakenOverAt: true,
  transporters: {
    select: {
      id: true,
      number: true,
      transporterTakenOverAt: true,
      transporterTransportSignatureDate: true,
      transporterCompanySiret: true,
      transporterCompanyVatNumber: true
    }
  }
};

type MinimalBspaohForLookup = Prisma.BspaohGetPayload<{
  select: typeof minimalBspaohForLookupSelect;
}>;

const bspaohToLookupCreateInputs = (
  bspaoh: MinimalBspaohForLookup
): Prisma.RegistryLookupUncheckedCreateInput[] => {
  const res: Prisma.RegistryLookupUncheckedCreateInput[] = [];
  const transporter = getFirstTransporterSync(bspaoh);
  if (
    bspaoh.destinationReceptionSignatureDate &&
    bspaoh.destinationCompanySiret
  ) {
    res.push({
      id: bspaoh.id,
      readableId: bspaoh.id,
      siret: bspaoh.destinationCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bspaoh.wasteCode,
      ...generateDateInfos(
        bspaoh.destinationReceptionDate ??
        bspaoh.destinationReceptionSignatureDate,
        bspaoh.createdAt
      ),
      bspaohId: bspaoh.id
    });
  }
  if (
    transporter?.transporterTransportSignatureDate &&
    bspaoh.emitterCompanySiret
  ) {
    res.push({
      id: bspaoh.id,
      readableId: bspaoh.id,
      siret: bspaoh.emitterCompanySiret,
      exportRegistryType: RegistryExportType.OUTGOING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bspaoh.wasteCode,
      ...generateDateInfos(
        transporter.transporterTakenOverAt ??
        transporter.transporterTransportSignatureDate,
        bspaoh.createdAt
      ),
      bspaohId: bspaoh.id
    });
  }
  if (transporter?.transporterTransportSignatureDate) {
    const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
    if (transporterCompanyOrgId) {
      res.push({
        id: bspaoh.id,
        readableId: bspaoh.id,
        siret: transporterCompanyOrgId,
        exportRegistryType: RegistryExportType.TRANSPORTED,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bspaoh.wasteCode,
        ...generateDateInfos(
          transporter.transporterTakenOverAt ??
          transporter.transporterTransportSignatureDate,
          bspaoh.createdAt
        ),
        bspaohId: bspaoh.id
      });
    }
  }
  return res;
};

export const updateRegistryLookup = async (
  bspaoh: MinimalBspaohForLookup
): Promise<void> => {
  await prisma.$transaction(async tx => {
    // acquire an advisory lock on the bspaoh id
    // see more explanation in bsda/registryV2.ts
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${bspaoh.id}, 0))`;

    await deleteRegistryLookup(bspaoh.id, tx);
    const lookupInputs = bspaohToLookupCreateInputs(bspaoh);
    if (lookupInputs.length > 0) {
      try {
        await tx.registryLookup.createMany({
          data: lookupInputs
        });
      } catch (error) {
        logger.error(`Error creating registry lookup for bspaoh ${bspaoh.id}`);
        logger.error(lookupInputs);
        throw error;
      }
    }
  });
};

export const rebuildRegistryLookup =
  rebuildRegistryLookupGeneric<MinimalBspaohForLookup>({
    name: "BSPAOH",
    getTotalCount: () =>
      prisma.bspaoh.count({
        where: {
          isDeleted: false,
          NOT: {
            status: "DRAFT"
          }
        }
      }),
    findMany: (pageSize, cursorId) =>
      prisma.bspaoh.findMany({
        where: {
          isDeleted: false,
          NOT: {
            status: "DRAFT"
          }
        },
        take: pageSize,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        orderBy: {
          id: "desc"
        },
        select: minimalBspaohForLookupSelect
      }),
    toLookupData: items => {
      let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
      for (const bspaoh of items) {
        const createInputs = bspaohToLookupCreateInputs(bspaoh);
        createArray = createArray.concat(createInputs);
      }
      return createArray;
    }
  });

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
