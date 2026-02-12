import {
  Prisma,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@td/prisma";
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
import { kgToTonRegistryV2 } from "../common/converter";
import {
  emptyIncomingWasteV2,
  emptyManagedWasteV2,
  emptyOutgoingWasteV2,
  emptyTransportedWasteV2,
  emptyAllWasteV2,
  RegistryV2Bsvhu
} from "../registryV2/types";
import {
  deleteRegistryLookup,
  generateDateInfos,
  rebuildRegistryLookupGeneric
} from "@td/registry";
import { logger } from "@td/logger";
import { BsvhuForElastic } from "./elastic";
import { getFirstTransporterSync, getTransportersSync } from "./database";
import { getTransporterCompanyOrgId } from "@td/constants";

export const toIncomingWasteV2 = (
  bsvhu: RegistryV2Bsvhu
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsvhu);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    transporter.transporterCompanyAddress,
    transporter.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    transporter2?.transporterCompanyAddress,
    transporter2?.transporterCompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    transporter3?.transporterCompanyAddress,
    transporter3?.transporterCompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    transporter4?.transporterCompanyAddress,
    transporter4?.transporterCompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    transporter5?.transporterCompanyAddress,
    transporter5?.transporterCompanyVatNumber
  );
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
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
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
    weight: kgToTonRegistryV2(bsvhu.weightValue),
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
    transporter1CompanyName: transporter?.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: transporter?.transporterRecepisseNumber,
    transporter1TransportMode: transporter?.transporterTransportMode,
    transporter1CompanyMail: transporter?.transporterCompanyMail,
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
    destinationReceptionWeight: kgToTonRegistryV2(
      bsvhu.destinationReceptionWeight
    ),
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
    destinationOperationNoTraceability: false,
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2TransportMode: null,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5TransportMode: transporter5?.transporterTransportMode,
    transporter5CompanyMail: transporter5?.transporterCompanyMail
  };
};

export const toOutgoingWasteV2 = (
  bsvhu: RegistryV2Bsvhu
): Omit<Required<OutgoingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsvhu);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;

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
    transporter.transporterCompanyAddress,
    transporter.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    transporter2?.transporterCompanyAddress,
    transporter2?.transporterCompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    transporter3?.transporterCompanyAddress,
    transporter3?.transporterCompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    transporter4?.transporterCompanyAddress,
    transporter4?.transporterCompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    transporter5?.transporterCompanyAddress,
    transporter5?.transporterCompanyVatNumber
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
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
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
    weight: kgToTonRegistryV2(bsvhu.weightValue),
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
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyName: transporter?.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: transporter?.transporterRecepisseNumber,
    transporter1TransportMode: transporter?.transporterTransportMode,
    transporter1CompanyMail: transporter?.transporterCompanyMail,
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
    destinationReceptionWeight: kgToTonRegistryV2(
      bsvhu.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate: false,
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
    destinationParcelCoordinates: null,
    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2TransportMode: transporter2?.transporterTransportMode,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,

    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,

    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,

    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5TransportMode: transporter5?.transporterTransportMode,
    transporter5CompanyMail: transporter5?.transporterCompanyMail
  };
};

export const toTransportedWasteV2 = (
  bsvhu: RegistryV2Bsvhu,
  targetSiret: string
): Omit<Required<TransportedWasteV2>, "__typename"> | null => {
  const transporters = getTransportersSync(bsvhu);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const targetTransporter = transporters.find(
    t => getTransporterCompanyOrgId(t) === targetSiret
  );
  const transporterTakenOverAt =
    targetTransporter?.transporterTransportTakenOverAt ??
    targetTransporter?.transporterTransportSignatureDate ?? // in case takenOverAt is null, failover to signature date
    transporter?.transporterTransportTakenOverAt ?? // in case we don't find the target transporter, failover to the first transporter
    transporter?.transporterTransportSignatureDate;

  // there should always be a transporter on this type of export, but since
  // the type doesn't know it, and we could get a weird DB state, we check that we have a date
  if (!transporterTakenOverAt) {
    return null;
  }
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
    transporter.transporterCompanyAddress,
    transporter.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    transporter2?.transporterCompanyAddress,
    transporter2?.transporterCompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    transporter3?.transporterCompanyAddress,
    transporter3?.transporterCompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    transporter4?.transporterCompanyAddress,
    transporter4?.transporterCompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    transporter5?.transporterCompanyAddress,
    transporter5?.transporterCompanyVatNumber
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
    transporterTakenOverAt,
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
    weight: kgToTonRegistryV2(bsvhu.weightValue),
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

    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyName: transporter?.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: transporter?.transporterRecepisseNumber,
    transporter1TransportMode: transporter?.transporterTransportMode,
    transporter1CompanyMail: transporter?.transporterCompanyMail,
    transporter1TransportPlates: transporter?.transporterTransportPlates,

    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2TransportMode: transporter2?.transporterTransportMode,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter2TransportPlates: transporter2?.transporterTransportPlates,

    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter3TransportPlates: transporter3?.transporterTransportPlates,

    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter4TransportPlates: transporter4?.transporterTransportPlates,

    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5TransportMode: transporter5?.transporterTransportMode,
    transporter5CompanyMail: transporter5?.transporterCompanyMail,
    transporter5TransportPlates: transporter5?.transporterTransportPlates,

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
    destinationReceptionWeight: kgToTonRegistryV2(
      bsvhu.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate: false,
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
  const transporters = getTransportersSync(bsvhu);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
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
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    transporter2?.transporterCompanyAddress,
    transporter2?.transporterCompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    transporter3?.transporterCompanyAddress,
    transporter3?.transporterCompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    transporter4?.transporterCompanyAddress,
    transporter4?.transporterCompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    transporter5?.transporterCompanyAddress,
    transporter5?.transporterCompanyVatNumber
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
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
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
    weight: kgToTonRegistryV2(bsvhu.weightValue),
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
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: transporter?.transporterRecepisseNumber,
    transporter1TransportMode: transporter?.transporterTransportMode,
    transporter1CompanyMail: transporter?.transporterCompanyMail,
    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2TransportMode: transporter2?.transporterTransportMode,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5TransportMode: transporter5?.transporterTransportMode,
    transporter5CompanyMail: transporter5?.transporterCompanyMail,
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
    destinationReceptionWeight: kgToTonRegistryV2(
      bsvhu.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate: false,
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
  const transporters = getTransportersSync(bsvhu);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
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
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    transporter2?.transporterCompanyAddress,
    transporter2?.transporterCompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    transporter3?.transporterCompanyAddress,
    transporter3?.transporterCompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    transporter4?.transporterCompanyAddress,
    transporter4?.transporterCompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    transporter5?.transporterCompanyAddress,
    transporter5?.transporterCompanyVatNumber
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
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
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
    weight: kgToTonRegistryV2(bsvhu.weightValue),
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
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: transporter?.transporterRecepisseNumber,
    transporter1TransportMode: transporter?.transporterTransportMode,
    transporter1UnloadingDate: null,
    transporter1TransportPlates: transporter?.transporterTransportPlates,
    transporter1CompanyMail: transporter?.transporterCompanyMail,
    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2TransportMode: transporter2?.transporterTransportMode,
    transporter2UnloadingDate: null,
    transporter2TransportPlates: transporter2?.transporterTransportPlates,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter3UnloadingDate: null,
    transporter3TransportPlates: transporter3?.transporterTransportPlates,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter4UnloadingDate: null,
    transporter4TransportPlates: transporter4?.transporterTransportPlates,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5TransportMode: transporter5?.transporterTransportMode,
    transporter5UnloadingDate: null,
    transporter5TransportPlates: transporter5?.transporterTransportPlates,
    transporter5CompanyMail: transporter5?.transporterCompanyMail,
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
    destinationReceptionWeight: kgToTonRegistryV2(
      bsvhu.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate: false,
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
    for (const transporter of bsvhu.transporters ?? []) {
      if (transporter.transporterTransportSignatureDate) {
        const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
        if (transporterCompanyOrgId) {
          registryFields.isExhaustiveWasteFor.push(transporterCompanyOrgId);
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
  emitterCompanySiret: true,
  ecoOrganismeSiret: true,
  brokerCompanySiret: true,
  traderCompanySiret: true,
  wasteCode: true,
  transporters: {
    select: {
      id: true,
      number: true,
      transporterCompanySiret: true,
      transporterCompanyVatNumber: true,
      transporterTransportTakenOverAt: true,
      transporterTransportSignatureDate: true
    }
  },
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
  const transporter = getFirstTransporterSync(bsvhu);

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
  if (transporter?.transporterTransportSignatureDate) {
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
          transporter.transporterTransportTakenOverAt ??
            transporter.transporterTransportSignatureDate!,
          bsvhu.createdAt
        ),
        bsvhuId: bsvhu.id
      });
    });
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
          transporter.transporterTransportTakenOverAt ??
            transporter.transporterTransportSignatureDate!,
          bsvhu.createdAt
        ),
        bsvhuId: bsvhu.id
      });
    });
  }
  const transporterSirets = {};
  bsvhu.transporters?.forEach(transporter => {
    const transporterSiret = getTransporterCompanyOrgId(transporter);
    if (!transporter.transporterTransportSignatureDate || !transporterSiret) {
      return;
    }
    // we don't want to add the same transporter twice, the lookup index would have a conflict
    // + it's not really supposed to happen on real use cases
    // + the mapping would show the takenOver date of the first one anyways
    if (transporterSirets[transporterSiret]) {
      return;
    }
    transporterSirets[transporterSiret] = true;
    res.push({
      id: bsvhu.id,
      readableId: bsvhu.id,
      siret: transporterSiret,
      exportRegistryType: RegistryExportType.TRANSPORTED,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsvhu.wasteCode,
      ...generateDateInfos(
        transporter.transporterTransportTakenOverAt ??
          transporter.transporterTransportSignatureDate!,
        bsvhu.createdAt
      ),
      bsvhuId: bsvhu.id
    });
  });
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

export const rebuildRegistryLookup =
  rebuildRegistryLookupGeneric<MinimalBsvhuForLookup>({
    name: "BSVHU",
    getTotalCount: () =>
      prisma.bsvhu.count({
        where: {
          isDeleted: false,
          isDraft: false
        }
      }),
    findMany: (pageSize, cursorId) =>
      prisma.bsvhu.findMany({
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
      }),
    toLookupData: items => {
      let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
      for (const bsvhu of items) {
        const createInputs = bsvhuToLookupCreateInputs(bsvhu);
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
