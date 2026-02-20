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
} from "@td/prisma";
import {
  getBsdaWasteADRMention,
  getTransporterCompanyOrgId
} from "@td/constants";
import {
  emptyIncomingWasteV2,
  emptyManagedWasteV2,
  emptyOutgoingWasteV2,
  emptyTransportedWasteV2,
  emptyAllWasteV2,
  RegistryV2Bsda
} from "../registryV2/types";
import { splitAddress } from "../common/addresses";
import { getFirstTransporterSync, getTransportersSync } from "./database";
import { getBsdaSubType } from "../common/subTypes";
import { kgToTonRegistryV2 } from "../common/converter";
import { BsdaForElastic } from "./elastic";
import {
  deleteRegistryLookup,
  generateDateInfos,
  rebuildRegistryLookupGeneric
} from "@td/registry";
import { prisma } from "@td/prisma";
import { isFinalOperationCode } from "../common/operationCodes";
import { logger } from "@td/logger";
import { bsdaWasteQuantities } from "./utils";

const getQuantity = (packagings: Prisma.JsonValue) => {
  if (!packagings || !(packagings as PackagingInfo[])?.length) {
    return null;
  }

  return (packagings as PackagingInfo[])?.reduce(
    (totalQuantity, p) => totalQuantity + (p.quantity ?? 0),
    0
  );
};

const getInitialEmitterData = (bsda: RegistryV2Bsda) => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  if (bsda.forwarding) {
    const { street, postalCode, city, country } = splitAddress(
      bsda.forwarding.emitterCompanyAddress
    );

    initialEmitter.initialEmitterCompanyAddress = street;
    initialEmitter.initialEmitterCompanyPostalCode = postalCode;
    initialEmitter.initialEmitterCompanyCity = city;
    initialEmitter.initialEmitterCompanyCountry = country;

    initialEmitter.initialEmitterCompanyName =
      bsda.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsda.forwarding.emitterCompanySiret;
  }

  return initialEmitter;
};

const getPostTempStorageDestination = (bsda: RegistryV2Bsda) => {
  if (!bsda.forwardedIn) {
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
    bsda.forwardedIn.destinationCompanyAddress
  );

  return {
    postTempStorageDestinationName: bsda.forwardedIn.destinationCompanyName,
    postTempStorageDestinationSiret: bsda.forwardedIn.destinationCompanySiret,
    postTempStorageDestinationAddress: splittedAddress.street,
    postTempStorageDestinationPostalCode: splittedAddress.postalCode,
    postTempStorageDestinationCity: splittedAddress.city,
    // Always FR for now, as destination must be FR
    postTempStorageDestinationCountry: "FR"
  };
};

const getFinalOperationsData = (bsda: RegistryV2Bsda) => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  const destinationFinalOperationCompanySirets: string[] = [];

  // Check if finalOperations is defined and has elements
  if (
    bsda.destinationOperationSignatureDate &&
    bsda.destinationOperationCode &&
    // Cf tra-14603 => si le code de traitement du bordereau initial est final,
    // aucun code d'Opération(s) finale(s) réalisée(s) par la traçabilité suite
    // ni de Quantité(s) liée(s) ne doit remonter dans les deux colonnes.
    !isFinalOperationCode(bsda.destinationOperationCode) &&
    bsda.finalOperations?.length
  ) {
    // Iterate through each operation once and fill both arrays
    bsda.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(
        // conversion en tonnes
        kgToTonRegistryV2(ope.quantity)
      );
      if (ope.finalBsda.destinationCompanySiret) {
        // cela devrait tout le temps être le cas
        destinationFinalOperationCompanySirets.push(
          ope.finalBsda.destinationCompanySiret
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

export const toIncomingWasteV2 = (
  bsda: RegistryV2Bsda
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsda);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsda);
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
    city: destinationCompanyCity
  } = splitAddress(bsda.destinationCompanyAddress);

  const {
    street: workerCompanyAddress,
    postalCode: workerCompanyPostalCode,
    city: workerCompanyCity,
    country: workerCompanyCountry
  } = splitAddress(bsda.workerCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsda.emitterCompanyAddress);

  const wasteQuantities = bsdaWasteQuantities(bsda);
  const quantityAccepted = wasteQuantities?.quantityAccepted ?? null;
  const quantityRefused = wasteQuantities?.quantityRefused ?? null;

  return {
    ...emptyIncomingWasteV2,
    id: bsda.id,
    source: "BSD",
    publicId: null,
    bsdId: bsda.id,
    reportAsSiret: null,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationReceptionDate: bsda.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsda.destinationOperationDate,
    bsdType: "BSDA",
    bsdSubType: getBsdaSubType(bsda),
    customId: null,
    status: bsda.status,
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wasteCodeBale: null,
    wastePop: bsda.wastePop,
    wasteIsDangerous: true,
    weight: kgToTonRegistryV2(bsda.weightValue),
    quantity: getQuantity(bsda.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsda.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsda.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsda.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyMail: bsda.emitterCompanyMail,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyAddress,
    workerCompanyPostalCode,
    workerCompanyCity,
    workerCompanyCountry,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerCompanyMail: bsda.brokerCompanyMail,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    isDirectSupply: false,
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
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
    wasteAdr:
      getBsdaWasteADRMention({
        adr: bsda.wasteAdr,
        isSubjectToADR: bsda.wasteIsSubjectToADR
      }) ?? null,
    nonRoadRegulationMention: bsda.wasteNonRoadRegulationMention,
    destinationCap: bsda.destinationCap,
    wasteDap: null,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsda.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: kgToTonRegistryV2(
      bsda.destinationReceptionWeight
    ),
    destinationReceptionRefusedWeight: kgToTonRegistryV2(quantityRefused),
    destinationReceptionAcceptedWeight: kgToTonRegistryV2(quantityAccepted),
    destinationReceptionWeightIsEstimate:
      bsda.destinationReceptionWeightIsEstimate,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationOperationCodes: bsda.destinationOperationCode
      ? [bsda.destinationOperationCode]
      : null,
    destinationOperationModes: bsda.destinationOperationMode
      ? [bsda.destinationOperationMode]
      : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    ttdImportNumber: null,
    movementNumber: null,
    nextOperationCode:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null,
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
    transporter2TransportMode: transporter2?.transporterTransportMode,
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
  bsda: RegistryV2Bsda
): Omit<Required<OutgoingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsda);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsda);
  const {
    postTempStorageDestinationName,
    postTempStorageDestinationSiret,
    postTempStorageDestinationAddress,
    postTempStorageDestinationPostalCode,
    postTempStorageDestinationCity,
    postTempStorageDestinationCountry
  } = getPostTempStorageDestination(bsda);
  const {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsda);
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
  } = splitAddress(bsda.destinationCompanyAddress);

  const {
    street: workerCompanyAddress,
    postalCode: workerCompanyPostalCode,
    city: workerCompanyCity,
    country: workerCompanyCountry
  } = splitAddress(bsda.workerCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsda.emitterCompanyAddress);

  return {
    ...emptyOutgoingWasteV2,
    id: bsda.id,
    source: "BSD",
    publicId: null,
    bsdId: bsda.id,
    reportAsSiret: null,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationOperationDate: bsda.destinationOperationDate,
    bsdType: "BSDA",
    bsdSubType: getBsdaSubType(bsda),
    customId: null,
    status: bsda.status,
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wasteCodeBale: null,
    wastePop: bsda.wastePop,
    wasteIsDangerous: true,
    quantity: getQuantity(bsda.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weight: kgToTonRegistryV2(bsda.weightValue),
    weightIsEstimate: bsda.weightIsEstimate,
    volume: null,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsda.emitterCompanyMail,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsda.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsda.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsda.emitterPickupSiteAddress ? "FR" : null,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanyAddress,
    workerCompanyPostalCode,
    workerCompanyCity,
    workerCompanyCountry,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,
    ecoOrganismeName: bsda.ecoOrganismeName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanyMail: bsda.brokerCompanyMail,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
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
    wasteAdr:
      getBsdaWasteADRMention({
        adr: bsda.wasteAdr,
        isSubjectToADR: bsda.wasteIsSubjectToADR
      }) ?? null,
    nonRoadRegulationMention: bsda.wasteNonRoadRegulationMention,
    destinationCap: bsda.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsda.destinationCompanyMail,
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
      bsda.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: kgToTonRegistryV2(
      bsda.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate:
      bsda.destinationReceptionWeightIsEstimate,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: kgToTonRegistryV2(
      bsda.destinationReceptionRefusedWeight
    ),
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsda.destinationOperationCode
      ? [bsda.destinationOperationCode]
      : null,
    destinationOperationModes: bsda.destinationOperationMode
      ? [bsda.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes:
      bsda.destinationOperationNextDestinationPlannedOperationCode
        ? [bsda.destinationOperationNextDestinationPlannedOperationCode]
        : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    gistridNumber: null,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const toTransportedWasteV2 = (
  bsda: RegistryV2Bsda,
  targetSiret: string
): Omit<Required<TransportedWasteV2>, "__typename"> | null => {
  const transporters = getTransportersSync(bsda);

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
    street: workerCompanyAddress,
    postalCode: workerCompanyPostalCode,
    city: workerCompanyCity,
    country: workerCompanyCountry
  } = splitAddress(bsda.workerCompanyAddress);
  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsda.emitterCompanyAddress);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsda.destinationCompanyAddress);

  return {
    ...emptyTransportedWasteV2,
    id: bsda.id,
    source: "BSD",
    publicId: null,
    bsdId: bsda.id,
    reportAsSiret: null,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    transporterTakenOverAt,
    unloadingDate: null,
    destinationReceptionDate: bsda.destinationReceptionDate,
    bsdType: "BSDA",
    bsdSubType: getBsdaSubType(bsda),
    customId: null,
    status: bsda.status,
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wasteCodeBale: null,
    wastePop: bsda.wastePop,
    wasteIsDangerous: true,
    weight: kgToTonRegistryV2(bsda.weightValue),
    quantity: getQuantity(bsda.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weightIsEstimate: bsda.weightIsEstimate,
    volume: null,

    emitterCompanyIrregularSituation: null,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsda.emitterCompanyMail,

    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsda.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsda.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsda.emitterPickupSiteAddress ? "FR" : null,

    workerCompanyName: bsda.workerCompanyName,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyAddress,
    workerCompanyPostalCode,
    workerCompanyCity,
    workerCompanyCountry,

    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,

    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    brokerCompanyMail: bsda.brokerCompanyMail,

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

    wasteAdr:
      getBsdaWasteADRMention({
        adr: bsda.wasteAdr,
        isSubjectToADR: bsda.wasteIsSubjectToADR
      }) ?? null,
    nonRoadRegulationMention: bsda.wasteNonRoadRegulationMention,
    destinationCap: bsda.destinationCap,

    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsda.destinationCompanyMail,

    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,

    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: kgToTonRegistryV2(
      bsda.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate:
      bsda.destinationReceptionWeightIsEstimate,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: kgToTonRegistryV2(
      bsda.destinationReceptionRefusedWeight
    ),
    destinationHasCiterneBeenWashedOut: null,

    gistridNumber: null,
    movementNumber: null
  };
};

export const toManagedWasteV2 = (
  bsda: RegistryV2Bsda,
  targetSiret: string
): Omit<Required<ManagedWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsda);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsda);
  const {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsda);
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
  } = splitAddress(bsda.destinationCompanyAddress);

  const {
    street: workerCompanyAddress,
    postalCode: workerCompanyPostalCode,
    city: workerCompanyCity,
    country: workerCompanyCountry
  } = splitAddress(bsda.workerCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsda.emitterCompanyAddress);

  return {
    ...emptyManagedWasteV2,
    id: bsda.id,
    source: "BSD",
    publicId: null,
    bsdId: bsda.id,
    reportAsSiret: null,
    reportForSiret: targetSiret,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationOperationDate: bsda.destinationOperationDate,
    bsdType: "BSDA",
    bsdSubType: getBsdaSubType(bsda),
    customId: null,
    status: bsda.status,
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wasteCodeBale: null,
    wastePop: bsda.wastePop,
    wasteIsDangerous: true,
    quantity: getQuantity(bsda.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weight: kgToTonRegistryV2(bsda.weightValue),
    weightIsEstimate: bsda.weightIsEstimate,
    volume: null,
    managingStartDate: null,
    managingEndDate: null,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsda.emitterCompanyMail,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsda.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsda.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsda.emitterPickupSiteAddress ? "FR" : null,
    tempStorerCompanyOrgId: null,
    tempStorerCompanyName: null,
    tempStorerCompanyAddress: null,
    tempStorerCompanyPostalCode: null,
    tempStorerCompanyCity: null,
    tempStorerCompanyCountryCode: null,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanyAddress,
    workerCompanyPostalCode,
    workerCompanyCity,
    workerCompanyCountry,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,
    ecoOrganismeName: bsda.ecoOrganismeName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanyMail: bsda.brokerCompanyMail,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
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
    wasteAdr:
      getBsdaWasteADRMention({
        adr: bsda.wasteAdr,
        isSubjectToADR: bsda.wasteIsSubjectToADR
      }) ?? null,
    nonRoadRegulationMention: bsda.wasteNonRoadRegulationMention,
    destinationCap: bsda.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsda.destinationCompanyMail,
    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,

    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: kgToTonRegistryV2(
      bsda.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate:
      bsda.destinationReceptionWeightIsEstimate,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: kgToTonRegistryV2(
      bsda.destinationReceptionRefusedWeight
    ),
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsda.destinationOperationCode
      ? [bsda.destinationOperationCode]
      : null,
    destinationOperationModes: bsda.destinationOperationMode
      ? [bsda.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes:
      bsda.destinationOperationNextDestinationPlannedOperationCode
        ? [bsda.destinationOperationNextDestinationPlannedOperationCode]
        : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    gistridNumber: null,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const toAllWasteV2 = (
  bsda: RegistryV2Bsda
): Omit<Required<AllWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsda);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsda);
  const {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsda);

  const {
    postTempStorageDestinationName,
    postTempStorageDestinationSiret,
    postTempStorageDestinationAddress,
    postTempStorageDestinationPostalCode,
    postTempStorageDestinationCity,
    postTempStorageDestinationCountry
  } = getPostTempStorageDestination(bsda);

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
  } = splitAddress(bsda.destinationCompanyAddress);

  const {
    street: workerCompanyAddress,
    postalCode: workerCompanyPostalCode,
    city: workerCompanyCity,
    country: workerCompanyCountry
  } = splitAddress(bsda.workerCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsda.emitterCompanyAddress);

  return {
    ...emptyAllWasteV2,
    id: bsda.id,
    bsdId: bsda.id,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationReceptionDate: bsda.destinationReceptionDate,
    destinationOperationDate: bsda.destinationOperationDate,
    bsdType: "BSDA",
    bsdSubType: getBsdaSubType(bsda),
    customId: null,
    status: bsda.status,
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wastePop: bsda.wastePop,
    wasteIsDangerous: true,
    quantity: getQuantity(bsda.packagings),
    wasteContainsElectricOrHybridVehicles: null,
    weight: kgToTonRegistryV2(bsda.weightValue),
    weightIsEstimate: bsda.weightIsEstimate,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsda.emitterCompanyMail,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsda.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsda.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsda.emitterPickupSiteAddress ? "FR" : null,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanyAddress,
    workerCompanyPostalCode,
    workerCompanyCity,
    workerCompanyCountry,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,
    ecoOrganismeName: bsda.ecoOrganismeName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanyMail: bsda.brokerCompanyMail,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    traderCompanySiret: null,
    traderCompanyName: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    intermediary1CompanySiret: bsda.intermediaries?.[0]?.siret ?? null,
    intermediary1CompanyName: bsda.intermediaries?.[0]?.name ?? null,
    intermediary2CompanySiret: bsda.intermediaries?.[1]?.siret ?? null,
    intermediary2CompanyName: bsda.intermediaries?.[1]?.name ?? null,
    intermediary3CompanySiret: bsda.intermediaries?.[2]?.siret ?? null,
    intermediary3CompanyName: bsda.intermediaries?.[2]?.name ?? null,
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
    wasteAdr:
      getBsdaWasteADRMention({
        adr: bsda.wasteAdr,
        isSubjectToADR: bsda.wasteIsSubjectToADR
      }) ?? null,
    nonRoadRegulationMention: bsda.wasteNonRoadRegulationMention,
    destinationCap: bsda.destinationCap,
    wasteDap: null,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsda.destinationCompanyMail,
    postTempStorageDestinationSiret,
    postTempStorageDestinationName,
    postTempStorageDestinationAddress,
    postTempStorageDestinationPostalCode,
    postTempStorageDestinationCity,
    postTempStorageDestinationCountry,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: kgToTonRegistryV2(
      bsda.destinationReceptionWeight
    ),
    destinationReceptionWeightIsEstimate:
      bsda.destinationReceptionWeightIsEstimate,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: kgToTonRegistryV2(
      bsda.destinationReceptionRefusedWeight
    ),
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsda.destinationOperationCode
      ? [bsda.destinationOperationCode]
      : null,
    destinationOperationModes: bsda.destinationOperationMode
      ? [bsda.destinationOperationMode]
      : null,
    nextDestinationPlannedOperationCodes:
      bsda.destinationOperationNextDestinationPlannedOperationCode
        ? [bsda.destinationOperationNextDestinationPlannedOperationCode]
        : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    gistridNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const getElasticExhaustiveRegistryFields = (bsda: BsdaForElastic) => {
  const registryFields: Record<"isExhaustiveWasteFor", string[]> = {
    isExhaustiveWasteFor: []
  };
  if (!bsda.isDraft) {
    registryFields.isExhaustiveWasteFor = [
      bsda.destinationCompanySiret,
      bsda.emitterCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.workerCompanySiret,
      bsda.brokerCompanySiret
    ].filter(Boolean);
    if (bsda.intermediaries?.length) {
      for (const intermediary of bsda.intermediaries) {
        const intermediaryOrgId = intermediary.siret ?? intermediary.vatNumber;
        if (intermediaryOrgId) {
          registryFields.isExhaustiveWasteFor.push(intermediaryOrgId);
        }
      }
    }
    for (const transporter of bsda.transporters ?? []) {
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

const minimalBsdaForLookupSelect = {
  id: true,
  createdAt: true,
  destinationOperationSignatureDate: true,
  destinationReceptionDate: true,
  destinationCompanySiret: true,
  emitterCompanySiret: true,
  ecoOrganismeSiret: true,
  workerCompanySiret: true,
  brokerCompanySiret: true,
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
      id: true,
      siret: true,
      vatNumber: true
    }
  }
};

type MinimalBsdaForLookup = Prisma.BsdaGetPayload<{
  select: typeof minimalBsdaForLookupSelect;
}>;

const bsdaToLookupCreateInputs = (
  bsda: MinimalBsdaForLookup
): Prisma.RegistryLookupUncheckedCreateInput[] => {
  const res: Prisma.RegistryLookupUncheckedCreateInput[] = [];
  const transporter = getFirstTransporterSync(bsda);

  if (bsda.destinationOperationSignatureDate && bsda.destinationCompanySiret) {
    res.push({
      id: bsda.id,
      readableId: bsda.id,
      siret: bsda.destinationCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsda.wasteCode,
      ...generateDateInfos(
        bsda.destinationReceptionDate ?? bsda.destinationOperationSignatureDate,
        bsda.createdAt
      ),
      bsdaId: bsda.id
    });
  }
  if (transporter?.transporterTransportSignatureDate) {
    const outgoingSirets = new Set([
      bsda.emitterCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.workerCompanySiret
    ]);
    outgoingSirets.forEach(siret => {
      if (!siret) {
        return;
      }
      res.push({
        id: bsda.id,
        readableId: bsda.id,
        siret,
        exportRegistryType: RegistryExportType.OUTGOING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsda.wasteCode,
        ...generateDateInfos(
          transporter.transporterTransportTakenOverAt ??
            transporter.transporterTransportSignatureDate!,
          bsda.createdAt
        ),
        bsdaId: bsda.id
      });
    });
    const managedSirets = new Set([bsda.brokerCompanySiret]);
    bsda.intermediaries?.forEach(intermediary => {
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
        id: bsda.id,
        readableId: bsda.id,
        siret,
        exportRegistryType: RegistryExportType.MANAGED,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsda.wasteCode,
        ...generateDateInfos(
          transporter.transporterTransportTakenOverAt ??
            transporter.transporterTransportSignatureDate!,
          bsda.createdAt
        ),
        bsdaId: bsda.id
      });
    });
  }
  const transporterSirets = {};
  bsda.transporters?.forEach(transporter => {
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
      id: bsda.id,
      readableId: bsda.id,
      siret: transporterSiret,
      exportRegistryType: RegistryExportType.TRANSPORTED,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsda.wasteCode,
      ...generateDateInfos(
        transporter.transporterTransportTakenOverAt ??
          transporter.transporterTransportSignatureDate!,
        bsda.createdAt
      ),
      bsdaId: bsda.id
    });
  });
  return res;
};

export const updateRegistryLookup = async (
  bsda: MinimalBsdaForLookup
): Promise<void> => {
  await prisma.$transaction(async tx => {
    /*
    Acquire an advisory lock on the bsda id
    This ensures that only one transaction can proceed with the delete and create
    operations at a time, preventing conflicts and inconsistencies.
    Example of problems :
    tx1: delete(id1) -------------------- create(id1, OUTGOING, siret1, wasteCode1) -> succeeds
    tx2: ----------- delete(id1) -------------------- create(id1, OUTGOING, siret1, wasteCode2) -> fails
    --> the second update would fail because of the unique constraint on (id, OUTGOING, siret1)
    leading to an outdated lookup table

    tx1: delete(id1) -------------------- create(id1, OUTGOING, siret1) -> succeeds
    tx2: ----------- delete(id1) -------------------- create(id1, OUTGOING, siret2) -> succeeds
    --> the second update would succeed, but without deleting the row created in the first tx,
    leading to an inconsistency.

    Without proper locking, the transaction doesn't prevent other transactions from
    deleting and creating the same rows in parallel, it only prevents the deletion to happen if the subsequent creation fails.

    Using a "select for update" lock would prevent most problems (if the lines already exist at the time the lock is acquired)
    since it would wait for the lock to be released before proceeding with the delete and create.
    But if the lines don't exist when the select for update is called, then nothing is locked
    and we end up with the same problems.

    Using an advisory lock allows us to define a lock that will prevent other transactions for operations
    on the same id, even if there isn't any rows for this id yet.
    They will have to wait for the lock to be released (at the end of the tx) before proceeding with the delete and create.
  */
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${bsda.id}, 0))`;

    // Now proceed with delete and create
    await deleteRegistryLookup(bsda.id, tx);
    const lookupInputs = bsdaToLookupCreateInputs(bsda);
    if (lookupInputs.length > 0) {
      try {
        await tx.registryLookup.createMany({
          data: lookupInputs
        });
      } catch (error) {
        logger.error(`Error creating registry lookup for bsda ${bsda.id}`);
        logger.error(lookupInputs);
        throw error;
      }
    }
  });
};

export const rebuildRegistryLookup =
  rebuildRegistryLookupGeneric<MinimalBsdaForLookup>({
    name: "BSDA",
    getTotalCount: () =>
      prisma.bsda.count({
        where: {
          isDeleted: false,
          isDraft: false
        }
      }),
    findMany: (pageSize, cursorId) =>
      prisma.bsda.findMany({
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
        select: minimalBsdaForLookupSelect
      }),
    toLookupData: items => {
      let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
      for (const bsda of items) {
        const createInputs = bsdaToLookupCreateInputs(bsda);
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
