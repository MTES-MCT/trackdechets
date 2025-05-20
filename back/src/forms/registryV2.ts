import {
  IncomingWasteV2,
  ManagedWasteV2,
  OutgoingWasteV2,
  PackagingInfo,
  TransportedWasteV2,
  AllWasteV2
} from "@td/codegen-back";
import {
  RegistryExportType,
  RegistryExportDeclarationType,
  RegistryExportWasteType,
  Prisma
} from "@prisma/client";
import {
  emptyIncomingWasteV2,
  emptyManagedWasteV2,
  emptyOutgoingWasteV2,
  emptyTransportedWasteV2,
  emptyAllWasteV2,
  RegistryV2Bsdd
} from "../registryV2/types";
import { formToBsddV2, BsddV2 } from "./compat";
import { getBsddSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import {
  createRegistryLogger,
  deleteRegistryLookup,
  generateDateInfos
} from "@td/registry";
import { prisma } from "@td/prisma";
import { isFinalOperationCode } from "../common/operationCodes";
import {
  getTransporterCompanyOrgId,
  INCOMING_TEXS_WASTE_CODES,
  isDangerous
} from "@td/constants";
import { logger } from "@td/logger";

const getInitialEmitterData = (bsdd: BsddV2) => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  // Bsd suite. Fill initial emitter data.
  if (bsdd.forwarding) {
    const { street, city, postalCode, country } = splitAddress(
      bsdd.forwarding.emitterCompanyAddress
    );
    initialEmitter.initialEmitterCompanyAddress = street;
    initialEmitter.initialEmitterCompanyCity = city;
    initialEmitter.initialEmitterCompanyPostalCode = postalCode;
    initialEmitter.initialEmitterCompanyCountry = country;

    initialEmitter.initialEmitterCompanyName =
      bsdd.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsdd.forwarding.emitterCompanySiret;
  }

  return initialEmitter;
};

const getPostTempStorageDestination = (bsdd: BsddV2) => {
  if (!bsdd.forwardedIn) {
    return {
      postTempStorageDestinationName: null,
      postTempStorageDestinationSiret: null,
      postTempStorageDestinationAddress: null,
      postTempStorageDestinationPostalCode: null,
      postTempStorageDestinationCity: null,
      postTempStorageDestinationCountry: null
    };
  }
  const splittedAddress = splitAddress(
    bsdd.forwardedIn.destinationCompanyAddress
  );

  return {
    postTempStorageDestinationName: bsdd.forwardedIn.destinationCompanyName,
    postTempStorageDestinationSiret: bsdd.forwardedIn.destinationCompanySiret,
    postTempStorageDestinationAddress: splittedAddress.street,
    postTempStorageDestinationPostalCode: splittedAddress.postalCode,
    postTempStorageDestinationCity: splittedAddress.city,
    // Always FR for now, as destination must be FR
    postTempStorageDestinationCountry: "FR"
  };
};

const getFinalOperationsData = (bsdd: BsddV2) => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  const destinationFinalOperationCompanySirets: string[] = [];
  // Check if finalOperations is defined and has elements

  // Cf tra-14603 => si le code de traitement du bordereau initial est final,
  // aucun code d'Opération(s) finale(s) réalisée(s) par la traçabilité suite
  // ni de Quantité(s) liée(s) ne doit remonter dans les deux colonnes.
  const bsddIsFinal =
    bsdd.destinationOperationSignatureDate &&
    (isFinalOperationCode(bsdd.destinationOperationCode) ||
      bsdd.destinationOperationNoTraceability);

  if (!bsddIsFinal && bsdd.finalOperations?.length) {
    // Iterate through each operation once and fill both arrays
    bsdd.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(ope.quantity.toNumber());
      if (ope.finalForm.recipientCompanySiret) {
        // cela devrait tout le temps être le cas
        destinationFinalOperationCompanySirets.push(
          ope.finalForm.recipientCompanySiret
        );
      }
    });
  }
  return {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  };
};

const getQuantity = (packagings: PackagingInfo[]) => {
  if (!packagings) {
    return null;
  }
  return packagings.reduce(
    (totalQuantity, p) => totalQuantity + (p.quantity ?? 0),
    0
  );
};

const getWasteType = (bsdd: MinimalBsddForLookup): RegistryExportWasteType => {
  if (!bsdd.wasteDetailsCode) {
    return RegistryExportWasteType.DND;
  }
  if (INCOMING_TEXS_WASTE_CODES.includes(bsdd.wasteDetailsCode)) {
    return RegistryExportWasteType.TEXS;
  }
  return isDangerous(bsdd.wasteDetailsCode) ||
    bsdd.wasteDetailsPop ||
    bsdd.wasteDetailsIsDangerous
    ? RegistryExportWasteType.DD
    : RegistryExportWasteType.DND;
};

export const toIncomingWasteV2 = (
  form: RegistryV2Bsdd
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const bsdd = formToBsddV2(form);

  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsdd);
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsdd.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdd.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdd.transporterCompanyAddress,
    bsdd.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    bsdd.transporter2CompanyAddress,
    bsdd.transporter2CompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    bsdd.transporter3CompanyAddress,
    bsdd.transporter3CompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    bsdd.transporter4CompanyAddress,
    bsdd.transporter4CompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    bsdd.transporter5CompanyAddress,
    bsdd.transporter5CompanyVatNumber
  );

  return {
    ...emptyIncomingWasteV2,
    id: bsdd.id,
    source: "BSD",
    publicId: null,
    bsdId: bsdd.id,
    reportAsSiret: null,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsdd.destinationOperationDate,
    bsdType: "BSDD",
    bsdSubType: getBsddSubType(bsdd),
    customId: bsdd.customId,
    status: bsdd.status,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    wasteCodeBale: null,
    wastePop: bsdd.pop,
    wasteIsDangerous: bsdd.wasteIsDangerous,
    quantity: getQuantity(bsdd.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weight: bsdd.weightValue,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: bsdd.emitterType,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdd.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdd.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdd.emitterPickupSiteAddress ? "FR" : null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: bsdd.parcelCities,
    parcelInseeCodes: bsdd.parcelInseeCodes || bsdd.parcelPostalCodes,
    parcelNumbers: bsdd.parcelNumbers,
    parcelCoordinates: bsdd.parcelCoordinates,
    sisIdentifiers: bsdd.wasteDetailsLandIdentifiers,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiret: bsdd.ecoOrganismeSiret,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderCompanyMail: bsdd.traderCompanyMail,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    isDirectSupply: bsdd.isDirectSupply,
    transporter1CompanyName: bsdd.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: bsdd.transporterCompanySiret?.length
      ? bsdd.transporterCompanySiret
      : bsdd.transporterCompanyVatNumber,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdd.transporterRecepisseNumber,
    transporter1TransportMode: bsdd.transporterTransportMode,
    transporter1CompanyMail: bsdd.transporterCompanyMail,
    wasteAdr: bsdd.wasteAdr,
    nonRoadRegulationMention: bsdd.nonRoadRegulationMention,
    destinationCap: bsdd.destinationCap,
    wasteDap: null,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationOperationCodes: bsdd.destinationOperationCode
      ? [bsdd.destinationOperationCode]
      : null,
    destinationOperationModes: bsdd.destinationOperationMode
      ? [bsdd.destinationOperationMode]
      : null,
    destinationHasCiterneBeenWashedOut: bsdd.destinationHasCiterneBeenWashedOut,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    ttdImportNumber: null,
    movementNumber: null,
    nextOperationCode: bsdd.nextDestinationProcessingOperation,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null,
    transporter2CompanyName: bsdd.transporter2CompanyName ?? null,
    transporter2CompanyGivenName: null,
    transporter2CompanySiret:
      (bsdd.transporter2CompanySiret?.length
        ? bsdd.transporter2CompanySiret
        : bsdd.transporter2CompanyVatNumber) ?? null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      bsdd.transporter2RecepisseIsExempted ?? null,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber ?? null,
    transporter2TransportMode: bsdd.transporter2TransportMode ?? null,
    transporter2CompanyMail: bsdd.transporter2CompanyMail ?? null,
    transporter3CompanyName: bsdd.transporter3CompanyName ?? null,
    transporter3CompanyGivenName: null,
    transporter3CompanySiret:
      (bsdd.transporter3CompanySiret?.length
        ? bsdd.transporter3CompanySiret
        : bsdd.transporter3CompanyVatNumber) ?? null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      bsdd.transporter3RecepisseIsExempted ?? null,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber ?? null,
    transporter3TransportMode: bsdd.transporter3TransportMode ?? null,
    transporter3CompanyMail: bsdd.transporter3CompanyMail ?? null,
    transporter4CompanyName: bsdd.transporter4CompanyName ?? null,
    transporter4CompanyGivenName: null,
    transporter4CompanySiret:
      (bsdd.transporter4CompanySiret?.length
        ? bsdd.transporter4CompanySiret
        : bsdd.transporter4CompanyVatNumber) ?? null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      bsdd.transporter4RecepisseIsExempted ?? null,
    transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber ?? null,
    transporter4TransportMode: bsdd.transporter4TransportMode ?? null,
    transporter4CompanyMail: bsdd.transporter4CompanyMail ?? null,
    transporter5CompanyName: bsdd.transporter5CompanyName ?? null,
    transporter5CompanyGivenName: null,
    transporter5CompanySiret:
      (bsdd.transporter5CompanySiret?.length
        ? bsdd.transporter5CompanySiret
        : bsdd.transporter5CompanyVatNumber) ?? null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      bsdd.transporter5RecepisseIsExempted ?? null,
    transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber ?? null,
    transporter5TransportMode: bsdd.transporter5TransportMode ?? null,
    transporter5CompanyMail: bsdd.transporter5CompanyMail ?? null
  };
};

export const toOutgoingWasteV2 = (
  form: RegistryV2Bsdd
): Omit<Required<OutgoingWasteV2>, "__typename"> => {
  const bsdd = formToBsddV2(form);
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsdd);

  const {
    postTempStorageDestinationName,
    postTempStorageDestinationSiret,
    postTempStorageDestinationAddress,
    postTempStorageDestinationPostalCode,
    postTempStorageDestinationCity,
    postTempStorageDestinationCountry
  } = getPostTempStorageDestination(bsdd);

  const {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsdd);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsdd.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdd.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdd.transporterCompanyAddress,
    bsdd.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    bsdd.transporter2CompanyAddress,
    bsdd.transporter2CompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    bsdd.transporter3CompanyAddress,
    bsdd.transporter3CompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    bsdd.transporter4CompanyAddress,
    bsdd.transporter4CompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    bsdd.transporter5CompanyAddress,
    bsdd.transporter5CompanyVatNumber
  );

  return {
    ...emptyOutgoingWasteV2,
    id: bsdd.id,
    source: "BSD",
    publicId: null,
    bsdId: bsdd.id,
    reportAsSiret: null,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationOperationDate: bsdd.destinationOperationDate,
    bsdType: "BSDD",
    bsdSubType: getBsddSubType(bsdd),
    customId: bsdd.customId,
    status: bsdd.status,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    wasteCodeBale: null,
    wastePop: bsdd.pop,
    wasteIsDangerous: bsdd.wasteIsDangerous,
    quantity: getQuantity(bsdd.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weight: bsdd.weightValue,
    weightIsEstimate: bsdd.weightIsEstimate,
    volume: null,
    initialEmitterCompanySiret,
    initialEmitterCompanyName,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: bsdd.emitterType,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdd.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdd.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdd.emitterPickupSiteAddress ? "FR" : null,
    workerCompanySiret: null,
    workerCompanyName: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: bsdd.parcelCities,
    parcelInseeCodes: bsdd.parcelInseeCodes || bsdd.parcelPostalCodes,
    parcelNumbers: bsdd.parcelNumbers,
    parcelCoordinates: bsdd.parcelCoordinates,
    sisIdentifiers: bsdd.wasteDetailsLandIdentifiers,
    ecoOrganismeSiret: bsdd.ecoOrganismeSiret,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanyMail: bsdd.traderCompanyMail,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    isDirectSupply: bsdd.isDirectSupply,
    transporter1CompanySiret: bsdd.transporterCompanySiret?.length
      ? bsdd.transporterCompanySiret
      : bsdd.transporterCompanyVatNumber,
    transporter1CompanyName: bsdd.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdd.transporterRecepisseNumber,
    transporter1TransportMode: bsdd.transporterTransportMode,
    transporter1CompanyMail: bsdd.transporterCompanyMail,
    transporter2CompanySiret:
      (bsdd.transporter2CompanySiret?.length
        ? bsdd.transporter2CompanySiret
        : bsdd.transporter2CompanyVatNumber) ?? null,
    transporter2CompanyName: bsdd.transporter2CompanyName ?? null,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      bsdd.transporter2RecepisseIsExempted ?? null,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber ?? null,
    transporter2TransportMode: bsdd.transporter2TransportMode ?? null,
    transporter2CompanyMail: bsdd.transporter2CompanyMail ?? null,
    transporter3CompanySiret:
      (bsdd.transporter3CompanySiret?.length
        ? bsdd.transporter3CompanySiret
        : bsdd.transporter3CompanyVatNumber) ?? null,
    transporter3CompanyName: bsdd.transporter3CompanyName ?? null,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      bsdd.transporter3RecepisseIsExempted ?? null,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber ?? null,
    transporter3TransportMode: bsdd.transporter3TransportMode ?? null,
    transporter3CompanyMail: bsdd.transporter3CompanyMail ?? null,
    transporter4CompanySiret:
      (bsdd.transporter4CompanySiret?.length
        ? bsdd.transporter4CompanySiret
        : bsdd.transporter4CompanyVatNumber) ?? null,
    transporter4CompanyName: bsdd.transporter4CompanyName ?? null,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      bsdd.transporter4RecepisseIsExempted ?? null,
    transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber ?? null,
    transporter4TransportMode: bsdd.transporter4TransportMode ?? null,
    transporter4CompanyMail: bsdd.transporter4CompanyMail ?? null,
    transporter5CompanySiret:
      (bsdd.transporter5CompanySiret?.length
        ? bsdd.transporter5CompanySiret
        : bsdd.transporter5CompanyVatNumber) ?? null,
    transporter5CompanyName: bsdd.transporter5CompanyName ?? null,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      bsdd.transporter5RecepisseIsExempted ?? null,
    transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber ?? null,
    transporter5TransportMode: bsdd.transporter5TransportMode ?? null,
    transporter5CompanyMail: bsdd.transporter5CompanyMail ?? null,
    wasteAdr: bsdd.wasteAdr,
    nonRoadRegulationMention: bsdd.nonRoadRegulationMention,
    destinationCap: bsdd.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,
    postTempStorageDestinationSiret,
    postTempStorageDestinationName,
    postTempStorageDestinationAddress,
    postTempStorageDestinationPostalCode,
    postTempStorageDestinationCity,
    postTempStorageDestinationCountry,

    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsdd.destinationOperationCode
      ? [bsdd.destinationOperationCode]
      : null,
    destinationOperationModes: bsdd.destinationOperationMode
      ? [bsdd.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes:
      bsdd.nextDestinationProcessingOperation
        ? [bsdd.nextDestinationProcessingOperation]
        : null,
    destinationHasCiterneBeenWashedOut: bsdd.destinationHasCiterneBeenWashedOut,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationFinalOperationCompanySirets,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    gistridNumber: bsdd.nextDestinationNotificationNumber,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const toTransportedWasteV2 = (
  form: RegistryV2Bsdd,
  targetSiret: string
): Omit<Required<TransportedWasteV2>, "__typename"> | null => {
  const bsdd = formToBsddV2(form);
  const transporters = (form.transporters ?? []).sort(
    (t1, t2) => t1.number - t2.number
  );
  const targetTransporter = transporters.find(
    t => getTransporterCompanyOrgId(t) === targetSiret
  );
  const transporterTakenOverAt =
    targetTransporter?.takenOverAt ?? bsdd.transporterTransportTakenOverAt; // in case we don't find the target transporter, failover to the first transporter

  // there should always be a transporter on this type of export, but since
  // the type doesn't know it, and we could get a weird DB state, we check that we have a date
  if (!transporterTakenOverAt) {
    return null;
  }

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsdd.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdd.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdd.transporterCompanyAddress,
    bsdd.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    bsdd.transporter2CompanyAddress,
    bsdd.transporter2CompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    bsdd.transporter3CompanyAddress,
    bsdd.transporter3CompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    bsdd.transporter4CompanyAddress,
    bsdd.transporter4CompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    bsdd.transporter5CompanyAddress,
    bsdd.transporter5CompanyVatNumber
  );

  return {
    ...emptyTransportedWasteV2,
    id: bsdd.id,
    source: "BSD",
    publicId: null,
    bsdId: bsdd.id,
    reportAsSiret: null,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
    transporterTakenOverAt,
    unloadingDate: null,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    bsdType: "BSDD",
    bsdSubType: getBsddSubType(bsdd),
    customId: bsdd.customId,
    status: bsdd.status,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    wasteCodeBale: null,
    wastePop: bsdd.pop,
    wasteIsDangerous: bsdd.wasteIsDangerous,
    weight: bsdd.weightValue,
    quantity: getQuantity(bsdd.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weightIsEstimate: bsdd.weightIsEstimate,
    volume: null,

    emitterCompanyIrregularSituation: null,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsdd.emitterCompanyMail,

    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdd.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdd.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdd.emitterPickupSiteAddress ? "FR" : null,

    workerCompanySiret: null,
    workerCompanyName: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,

    ecoOrganismeSiret: bsdd.ecoOrganismeSiret,
    ecoOrganismeName: bsdd.ecoOrganismeName,

    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    brokerCompanyMail: bsdd.brokerCompanyMail,

    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    traderCompanyMail: bsdd.traderCompanyMail,

    transporter1CompanySiret: bsdd.transporterCompanySiret?.length
      ? bsdd.transporterCompanySiret
      : bsdd.transporterCompanyVatNumber,
    transporter1CompanyName: bsdd.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdd.transporterRecepisseNumber,
    transporter1TransportMode: bsdd.transporterTransportMode,
    transporter1CompanyMail: bsdd.transporterCompanyMail,
    transporter1TransportPlates: bsdd.transporterNumberPlates,

    transporter2CompanySiret:
      (bsdd.transporter2CompanySiret?.length
        ? bsdd.transporter2CompanySiret
        : bsdd.transporter2CompanyVatNumber) ?? null,
    transporter2CompanyName: bsdd.transporter2CompanyName ?? null,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      bsdd.transporter2RecepisseIsExempted ?? null,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber ?? null,
    transporter2TransportMode: bsdd.transporter2TransportMode ?? null,
    transporter2CompanyMail: bsdd.transporter2CompanyMail ?? null,
    transporter2TransportPlates: bsdd.transporter2NumberPlates ?? null,

    transporter3CompanySiret:
      (bsdd.transporter3CompanySiret?.length
        ? bsdd.transporter3CompanySiret
        : bsdd.transporter3CompanyVatNumber) ?? null,
    transporter3CompanyName: bsdd.transporter3CompanyName ?? null,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      bsdd.transporter3RecepisseIsExempted ?? null,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber ?? null,
    transporter3TransportMode: bsdd.transporter3TransportMode ?? null,
    transporter3CompanyMail: bsdd.transporter3CompanyMail ?? null,
    transporter3TransportPlates: bsdd.transporter3NumberPlates ?? null,

    transporter4CompanySiret:
      (bsdd.transporter4CompanySiret?.length
        ? bsdd.transporter4CompanySiret
        : bsdd.transporter4CompanyVatNumber) ?? null,
    transporter4CompanyName: bsdd.transporter4CompanyName ?? null,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      bsdd.transporter4RecepisseIsExempted ?? null,
    transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber ?? null,
    transporter4TransportMode: bsdd.transporter4TransportMode ?? null,
    transporter4CompanyMail: bsdd.transporter4CompanyMail ?? null,
    transporter4TransportPlates: bsdd.transporter4NumberPlates ?? null,

    transporter5CompanySiret:
      (bsdd.transporter5CompanySiret?.length
        ? bsdd.transporter5CompanySiret
        : bsdd.transporter5CompanyVatNumber) ?? null,
    transporter5CompanyName: bsdd.transporter5CompanyName ?? null,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      bsdd.transporter5RecepisseIsExempted ?? null,
    transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber ?? null,
    transporter5TransportMode: bsdd.transporter5TransportMode ?? null,
    transporter5CompanyMail: bsdd.transporter5CompanyMail ?? null,
    transporter5TransportPlates: bsdd.transporter5NumberPlates ?? null,

    wasteAdr: bsdd.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,

    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsdd.destinationCompanyMail,

    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,

    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationHasCiterneBeenWashedOut: bsdd.destinationHasCiterneBeenWashedOut,

    gistridNumber: bsdd.nextDestinationNotificationNumber,
    movementNumber: null
  };
};

export const toManagedWasteV2 = (
  form: RegistryV2Bsdd,
  targetSiret: string
): Omit<Required<ManagedWasteV2>, "__typename"> => {
  const bsdd = formToBsddV2(form);
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsdd);

  const {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsdd);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsdd.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdd.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdd.transporterCompanyAddress,
    bsdd.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    bsdd.transporter2CompanyAddress,
    bsdd.transporter2CompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    bsdd.transporter3CompanyAddress,
    bsdd.transporter3CompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    bsdd.transporter4CompanyAddress,
    bsdd.transporter4CompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    bsdd.transporter5CompanyAddress,
    bsdd.transporter5CompanyVatNumber
  );

  return {
    ...emptyManagedWasteV2,
    id: bsdd.id,
    source: "BSD",
    publicId: null,
    bsdId: bsdd.id,
    reportAsSiret: null,
    reportForSiret: targetSiret,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationOperationDate: bsdd.destinationOperationDate,
    bsdType: "BSDD",
    bsdSubType: getBsddSubType(bsdd),
    customId: bsdd.customId,
    status: bsdd.status,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    wasteCodeBale: null,
    wastePop: bsdd.pop,
    wasteIsDangerous: bsdd.wasteIsDangerous,
    quantity: getQuantity(bsdd.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weight: bsdd.weightValue,
    weightIsEstimate: bsdd.weightIsEstimate,
    volume: null,
    managingStartDate: null,
    managingEndDate: null,
    initialEmitterCompanySiret,
    initialEmitterCompanyName,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: bsdd.emitterType,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdd.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdd.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdd.emitterPickupSiteAddress ? "FR" : null,
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
    parcelCities: bsdd.parcelCities,
    parcelInseeCodes: bsdd.parcelInseeCodes || bsdd.parcelPostalCodes,
    parcelNumbers: bsdd.parcelNumbers,
    parcelCoordinates: bsdd.parcelCoordinates,
    sisIdentifiers: bsdd.wasteDetailsLandIdentifiers,
    ecoOrganismeSiret: bsdd.ecoOrganismeSiret,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanyMail: bsdd.traderCompanyMail,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    isDirectSupply: bsdd.isDirectSupply,
    transporter1CompanySiret: bsdd.transporterCompanySiret?.length
      ? bsdd.transporterCompanySiret
      : bsdd.transporterCompanyVatNumber,
    transporter1CompanyName: bsdd.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdd.transporterRecepisseNumber,
    transporter1TransportMode: bsdd.transporterTransportMode,
    transporter1CompanyMail: bsdd.transporterCompanyMail,
    transporter2CompanySiret:
      (bsdd.transporter2CompanySiret?.length
        ? bsdd.transporter2CompanySiret
        : bsdd.transporter2CompanyVatNumber) ?? null,
    transporter2CompanyName: bsdd.transporter2CompanyName ?? null,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      bsdd.transporter2RecepisseIsExempted ?? null,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber ?? null,
    transporter2TransportMode: bsdd.transporter2TransportMode ?? null,
    transporter2CompanyMail: bsdd.transporter2CompanyMail ?? null,
    transporter3CompanySiret:
      (bsdd.transporter3CompanySiret?.length
        ? bsdd.transporter3CompanySiret
        : bsdd.transporter3CompanyVatNumber) ?? null,
    transporter3CompanyName: bsdd.transporter3CompanyName ?? null,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      bsdd.transporter3RecepisseIsExempted ?? null,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber ?? null,
    transporter3TransportMode: bsdd.transporter3TransportMode ?? null,
    transporter3CompanyMail: bsdd.transporter3CompanyMail ?? null,
    transporter4CompanySiret:
      (bsdd.transporter4CompanySiret?.length
        ? bsdd.transporter4CompanySiret
        : bsdd.transporter4CompanyVatNumber) ?? null,
    transporter4CompanyName: bsdd.transporter4CompanyName ?? null,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      bsdd.transporter4RecepisseIsExempted ?? null,
    transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber ?? null,
    transporter4TransportMode: bsdd.transporter4TransportMode ?? null,
    transporter4CompanyMail: bsdd.transporter4CompanyMail ?? null,
    transporter5CompanySiret:
      (bsdd.transporter5CompanySiret?.length
        ? bsdd.transporter5CompanySiret
        : bsdd.transporter5CompanyVatNumber) ?? null,
    transporter5CompanyName: bsdd.transporter5CompanyName ?? null,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      bsdd.transporter5RecepisseIsExempted ?? null,
    transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber ?? null,
    transporter5TransportMode: bsdd.transporter5TransportMode ?? null,
    transporter5CompanyMail: bsdd.transporter5CompanyMail ?? null,
    wasteAdr: bsdd.wasteAdr,
    nonRoadRegulationMention: bsdd.nonRoadRegulationMention,
    destinationCap: bsdd.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsdd.destinationOperationCode
      ? [bsdd.destinationOperationCode]
      : null,
    destinationOperationModes: bsdd.destinationOperationMode
      ? [bsdd.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes:
      bsdd.nextDestinationProcessingOperation
        ? [bsdd.nextDestinationProcessingOperation]
        : null,
    destinationHasCiterneBeenWashedOut: bsdd.destinationHasCiterneBeenWashedOut,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationFinalOperationCompanySirets,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    gistridNumber: bsdd.nextDestinationNotificationNumber,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const toAllWasteV2 = (
  form: RegistryV2Bsdd
): Omit<Required<AllWasteV2>, "__typename"> => {
  const bsdd = formToBsddV2(form);
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsdd);

  const {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsdd);

  const {
    postTempStorageDestinationName,
    postTempStorageDestinationSiret,
    postTempStorageDestinationAddress,
    postTempStorageDestinationPostalCode,
    postTempStorageDestinationCity,
    postTempStorageDestinationCountry
  } = getPostTempStorageDestination(bsdd);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsdd.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdd.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdd.transporterCompanyAddress,
    bsdd.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    bsdd.transporter2CompanyAddress,
    bsdd.transporter2CompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    bsdd.transporter3CompanyAddress,
    bsdd.transporter3CompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    bsdd.transporter4CompanyAddress,
    bsdd.transporter4CompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    bsdd.transporter5CompanyAddress,
    bsdd.transporter5CompanyVatNumber
  );

  return {
    ...emptyAllWasteV2,
    id: bsdd.id,
    bsdId: bsdd.id,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    destinationOperationDate: bsdd.destinationOperationDate,
    bsdType: "BSDD",
    bsdSubType: getBsddSubType(bsdd),
    customId: bsdd.customId,
    status: bsdd.status,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    wastePop: bsdd.pop,
    wasteIsDangerous: bsdd.wasteIsDangerous,
    quantity: getQuantity(bsdd.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weight: bsdd.weightValue,
    weightIsEstimate: bsdd.weightIsEstimate,
    initialEmitterCompanySiret,
    initialEmitterCompanyName,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: bsdd.emitterType,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdd.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdd.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdd.emitterPickupSiteAddress ? "FR" : null,
    workerCompanySiret: null,
    workerCompanyName: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: bsdd.parcelCities,
    parcelInseeCodes: bsdd.parcelInseeCodes || bsdd.parcelPostalCodes,
    parcelNumbers: bsdd.parcelNumbers,
    parcelCoordinates: bsdd.parcelCoordinates,
    sisIdentifiers: bsdd.wasteDetailsLandIdentifiers,
    ecoOrganismeSiret: bsdd.ecoOrganismeSiret,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanyMail: bsdd.traderCompanyMail,
    intermediary1CompanySiret: bsdd.intermediaries?.[0]?.siret ?? null,
    intermediary1CompanyName: bsdd.intermediaries?.[0]?.name ?? null,
    intermediary2CompanySiret: bsdd.intermediaries?.[1]?.siret ?? null,
    intermediary2CompanyName: bsdd.intermediaries?.[1]?.name ?? null,
    intermediary3CompanySiret: bsdd.intermediaries?.[2]?.siret ?? null,
    intermediary3CompanyName: bsdd.intermediaries?.[2]?.name ?? null,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    isDirectSupply: bsdd.isDirectSupply,
    transporter1CompanySiret: bsdd.transporterCompanySiret?.length
      ? bsdd.transporterCompanySiret
      : bsdd.transporterCompanyVatNumber,
    transporter1CompanyName: bsdd.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdd.transporterRecepisseNumber,
    transporter1TransportMode: bsdd.transporterTransportMode,
    transporter1UnloadingDate: null,
    transporter1TransportPlates: bsdd.transporterNumberPlates,
    transporter1CompanyMail: bsdd.transporterCompanyMail,
    transporter2CompanySiret:
      (bsdd.transporter2CompanySiret?.length
        ? bsdd.transporter2CompanySiret
        : bsdd.transporter2CompanyVatNumber) ?? null,
    transporter2CompanyName: bsdd.transporter2CompanyName ?? null,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      bsdd.transporter2RecepisseIsExempted ?? null,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber ?? null,
    transporter2TransportMode: bsdd.transporter2TransportMode ?? null,
    transporter2UnloadingDate: null,
    transporter2TransportPlates: bsdd.transporter2NumberPlates ?? null,
    transporter2CompanyMail: bsdd.transporter2CompanyMail ?? null,
    transporter3CompanySiret:
      (bsdd.transporter3CompanySiret?.length
        ? bsdd.transporter3CompanySiret
        : bsdd.transporter3CompanyVatNumber) ?? null,
    transporter3CompanyName: bsdd.transporter3CompanyName ?? null,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      bsdd.transporter3RecepisseIsExempted ?? null,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber ?? null,
    transporter3TransportMode: bsdd.transporter3TransportMode ?? null,
    transporter3UnloadingDate: null,
    transporter3TransportPlates: bsdd.transporter3NumberPlates ?? null,
    transporter3CompanyMail: bsdd.transporter3CompanyMail ?? null,
    transporter4CompanySiret:
      (bsdd.transporter4CompanySiret?.length
        ? bsdd.transporter4CompanySiret
        : bsdd.transporter4CompanyVatNumber) ?? null,
    transporter4CompanyName: bsdd.transporter4CompanyName ?? null,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      bsdd.transporter4RecepisseIsExempted ?? null,
    transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber ?? null,
    transporter4TransportMode: bsdd.transporter4TransportMode ?? null,
    transporter4UnloadingDate: null,
    transporter4TransportPlates: bsdd.transporter4NumberPlates ?? null,
    transporter4CompanyMail: bsdd.transporter4CompanyMail ?? null,
    transporter5CompanySiret:
      (bsdd.transporter5CompanySiret?.length
        ? bsdd.transporter5CompanySiret
        : bsdd.transporter5CompanyVatNumber) ?? null,
    transporter5CompanyName: bsdd.transporter5CompanyName ?? null,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      bsdd.transporter5RecepisseIsExempted ?? null,
    transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber ?? null,
    transporter5TransportMode: bsdd.transporter5TransportMode ?? null,
    transporter5UnloadingDate: null,
    transporter5TransportPlates: bsdd.transporter5NumberPlates ?? null,
    transporter5CompanyMail: bsdd.transporter5CompanyMail ?? null,
    wasteAdr: bsdd.wasteAdr,
    nonRoadRegulationMention: bsdd.nonRoadRegulationMention,
    destinationCap: bsdd.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    postTempStorageDestinationSiret,
    postTempStorageDestinationName,
    postTempStorageDestinationAddress,
    postTempStorageDestinationPostalCode,
    postTempStorageDestinationCity,
    postTempStorageDestinationCountry,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsdd.destinationOperationCode
      ? [bsdd.destinationOperationCode]
      : null,
    destinationOperationModes: bsdd.destinationOperationMode
      ? [bsdd.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes:
      bsdd.nextDestinationProcessingOperation
        ? [bsdd.nextDestinationProcessingOperation]
        : null,
    destinationHasCiterneBeenWashedOut: bsdd.destinationHasCiterneBeenWashedOut,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationFinalOperationCompanySirets,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    gistridNumber: bsdd.nextDestinationNotificationNumber,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

const minimalBsddForLookupSelect = {
  id: true,
  createdAt: true,
  readableId: true,
  receivedAt: true,
  sentAt: true,
  takenOverAt: true,
  recipientCompanySiret: true,
  emitterCompanySiret: true,
  ecoOrganismeSiret: true,
  brokerCompanySiret: true,
  traderCompanySiret: true,
  wasteDetailsIsDangerous: true,
  wasteDetailsCode: true,
  wasteDetailsPop: true,
  transporters: {
    select: {
      id: true,
      number: true,
      transporterCompanySiret: true,
      transporterCompanyVatNumber: true,
      takenOverAt: true
    }
  },
  intermediaries: {
    select: {
      id: true,
      siret: true,
      vatNumber: true
    }
  }
};

type MinimalBsddForLookup = Prisma.FormGetPayload<{
  select: typeof minimalBsddForLookupSelect;
}>;

const bsddToLookupCreateInputs = (
  form: MinimalBsddForLookup
): Prisma.RegistryLookupUncheckedCreateInput[] => {
  const res: Prisma.RegistryLookupUncheckedCreateInput[] = [];
  if (form.receivedAt && form.recipientCompanySiret) {
    res.push({
      id: form.id,
      readableId: form.readableId,
      siret: form.recipientCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: getWasteType(form),
      wasteCode: form.wasteDetailsCode,
      ...generateDateInfos(form.receivedAt, form.createdAt),
      bsddId: form.id
    });
  }
  if (form.sentAt) {
    const outgoingSirets = new Set([
      form.emitterCompanySiret,
      form.ecoOrganismeSiret
    ]);
    outgoingSirets.forEach(siret => {
      if (!siret) {
        return;
      }
      res.push({
        id: form.id,
        readableId: form.readableId,
        siret,
        exportRegistryType: RegistryExportType.OUTGOING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: getWasteType(form),
        wasteCode: form.wasteDetailsCode,
        ...generateDateInfos(form.takenOverAt ?? form.sentAt!, form.createdAt),
        bsddId: form.id
      });
    });
    const managedSirets = new Set([
      form.brokerCompanySiret,
      form.traderCompanySiret
    ]);
    form.intermediaries?.forEach(intermediary => {
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
        id: form.id,
        readableId: form.readableId,
        siret,
        exportRegistryType: RegistryExportType.MANAGED,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: getWasteType(form),
        wasteCode: form.wasteDetailsCode,
        ...generateDateInfos(form.takenOverAt ?? form.sentAt!, form.createdAt),
        bsddId: form.id
      });
    });
  }
  const transporterSirets = {};
  form.transporters?.forEach(transporter => {
    const transporterSiret = getTransporterCompanyOrgId(transporter);
    if (!transporterSiret || !transporter.takenOverAt) {
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
      id: form.id,
      readableId: form.readableId,
      siret: transporterSiret,
      exportRegistryType: RegistryExportType.TRANSPORTED,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: getWasteType(form),
      wasteCode: form.wasteDetailsCode,
      ...generateDateInfos(transporter.takenOverAt, form.createdAt),
      bsddId: form.id
    });
  });
  return res;
};

export const updateRegistryLookup = async (
  form: MinimalBsddForLookup
): Promise<void> => {
  await prisma.$transaction(async tx => {
    // acquire an advisory lock on the bsdd id
    // see more explanation in bsda/registryV2.ts
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${form.id}, 0))`;
    await deleteRegistryLookup(form.id, tx);
    const lookupInputs = bsddToLookupCreateInputs(form);
    if (lookupInputs.length > 0) {
      try {
        await tx.registryLookup.createMany({
          data: lookupInputs
        });
      } catch (error) {
        logger.error(`Error creating registry lookup for bsdd ${form.id}`);
        logger.error(lookupInputs);
        throw error;
      }
    }
  });
};

export const rebuildRegistryLookup = async (pageSize = 100, threads = 4) => {
  const logger = createRegistryLogger("BSDD");

  const total = await prisma.form.count({
    where: {
      isDeleted: false,
      NOT: {
        status: "DRAFT"
      }
    }
  });

  let done = false;
  let cursorId: string | null = null;
  let processedCount = 0;
  let operationId = 0;
  const pendingWrites = new Map<number, Promise<void>>();

  const processWrite = async (items: MinimalBsddForLookup[]) => {
    let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
    for (const bsdd of items) {
      const createInputs = bsddToLookupCreateInputs(bsdd);
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
    const items = await prisma.form.findMany({
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
      select: minimalBsddForLookupSelect
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
