import { IncomingWasteV2, OutgoingWasteV2 } from "@td/codegen-back";
import Decimal from "decimal.js";
import {
  BsffPackaging,
  BsffType,
  OperationMode,
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  WasteAcceptationStatus
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { getTransporterCompanyOrgId } from "@td/constants";
import {
  emptyIncomingWasteV2,
  emptyOutgoingWasteV2,
  RegistryV2Bsff
} from "../registryV2/types";
import { getFirstTransporterSync, getTransportersSync } from "./database";
import { splitAddress } from "../common/addresses";
import { getBsffSubType } from "../common/subTypes";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";
import { Nullable } from "../types";
import { isFinalOperation } from "./constants";

const getInitialEmitterData = (bsff: RegistryV2Bsff) => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  if (bsff.type === BsffType.REEXPEDITION) {
    const initialBsff = bsff.packagings[0]?.previousPackagings[0]?.bsff;
    if (initialBsff) {
      const { street, postalCode, city, country } = splitAddress(
        initialBsff.emitterCompanyAddress
      );

      // Legagcy reexpedition BSFFs may have been created without linking to previous packagings
      initialEmitter.initialEmitterCompanyAddress = street;
      initialEmitter.initialEmitterCompanyPostalCode = postalCode;
      initialEmitter.initialEmitterCompanyCity = city;
      initialEmitter.initialEmitterCompanyCountry = country;

      initialEmitter.initialEmitterCompanyName = initialBsff.emitterCompanyName;
      initialEmitter.initialEmitterCompanySiret =
        initialBsff.emitterCompanySiret;
    }
  }

  return initialEmitter;
};

type BsffDestinationV2 = {
  destinationReceptionAcceptationStatus: WasteAcceptationStatus;
  destinationReceptionWeight: number;
  destinationReceptionRefusedWeight: number;
  destinationReceptionAcceptedWeight: number;
  destinationOperationCodes: string[];
  destinationOperationModes: OperationMode[];
  destinationOperationDate: Date;
};

export function toBsffDestination(
  packagings: BsffPackaging[]
): Nullable<BsffDestinationV2> {
  const destinationReceptionWeight = packagings.reduce((weight, packaging) => {
    if (packaging.weight) {
      return weight + packaging.weight;
    }
    return weight;
  }, 0);

  const hasAnyReception = packagings.some(p => !!p.acceptationSignatureDate);

  const destinationReceptionAcceptedWeight = hasAnyReception
    ? packagings.reduce((acc, p) => {
        return acc + (p.acceptationWeight ?? 0);
      }, 0)
    : null;

  const destinationReceptionRefusedWeight = hasAnyReception
    ? packagings.reduce((acc, p) => {
        if (p.acceptationStatus === WasteAcceptationStatus.REFUSED) {
          return acc + p.weight;
        }
        return acc;
      }, 0)
    : null;

  const destinationReceptionAcceptationStatus = hasAnyReception
    ? (function () {
        const anyAccepted = packagings.some(
          p =>
            !!p.acceptationSignatureDate &&
            p.acceptationStatus === WasteAcceptationStatus.ACCEPTED
        );
        const anyRefused = packagings.some(
          p =>
            !!p.acceptationSignatureDate &&
            p.acceptationStatus === WasteAcceptationStatus.REFUSED
        );

        if (anyAccepted && !anyRefused) {
          return WasteAcceptationStatus.ACCEPTED;
        } else if (anyAccepted && anyRefused) {
          return WasteAcceptationStatus.PARTIALLY_REFUSED;
        } else if (!anyAccepted && anyRefused) {
          return WasteAcceptationStatus.REFUSED;
        } else {
          return null;
        }
      })()
    : null;

  const hasAnyOperation = packagings.some(
    p => !!p.operationSignatureDate && !!p.operationCode
  );

  const operationCodes = hasAnyOperation
    ? (packagings
        .filter(p => !!p.operationSignatureDate && !!p.operationCode)
        .map(p => p.operationCode) as string[])
    : [];

  const destinationOperationCodes = hasAnyOperation
    ? [...new Set(operationCodes)]
    : null;

  const operationModes = hasAnyOperation
    ? (packagings
        .filter(p => !!p.operationSignatureDate && !!p.operationMode)
        .map(p => p.operationMode) as OperationMode[])
    : [];

  const destinationOperationModes = hasAnyOperation
    ? [...new Set(operationModes)]
    : null;

  // returns last date
  const destinationOperationDate = hasAnyOperation
    ? [...packagings.map(p => p.operationDate).filter(Boolean)].sort(
        (d1, d2) => d2.getTime() - d1.getTime()
      )[0]
    : null;

  return {
    destinationReceptionAcceptationStatus,
    destinationReceptionWeight,
    destinationReceptionRefusedWeight,
    destinationReceptionAcceptedWeight,
    destinationOperationCodes,
    destinationOperationModes,
    destinationOperationDate
  };
}

const getFinalOperationsData = (bsff: RegistryV2Bsff) => {
  const nextDestinationPlannedOperationCodes: string[] = [];
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  const destinationFinalOperationCompanySirets: string[] = [];
  // Check if finalOperations is defined and has elements
  for (const packaging of bsff.packagings) {
    if (packaging.operationNextDestinationPlannedOperationCode) {
      nextDestinationPlannedOperationCodes.push(
        packaging.operationNextDestinationPlannedOperationCode
      );
    }
    if (
      packaging.operationSignatureDate &&
      packaging.operationCode &&
      // Cf tra-14603 => si le code de traitement du bordereau initial est final,
      // aucun code d'Opération(s) finale(s) réalisée(s) par la traçabilité suite
      // ni de Quantité(s) liée(s) ne doit remonter dans les deux colonnes.
      !isFinalOperation(
        packaging.operationCode,
        packaging.operationNoTraceability
      ) &&
      packaging.finalOperations?.length
    ) {
      // Iterate through each operation once and fill both arrays
      packaging.finalOperations.forEach(ope => {
        destinationFinalOperationCodes.push(ope.operationCode);

        // conversion en tonnes
        destinationFinalOperationWeights.push(
          ope.quantity.dividedBy(1000).toDecimalPlaces(6).toNumber()
        );
        if (ope.finalBsffPackaging.bsff.destinationCompanySiret) {
          // cela devrait tout le temps être le cas
          destinationFinalOperationCompanySirets.push(
            ope.finalBsffPackaging.bsff.destinationCompanySiret
          );
        }
      });
    }
  }

  return {
    nextDestinationPlannedOperationCodes,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  };
};

export const toIncomingWasteV2 = (
  bsff: RegistryV2Bsff
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsff);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsff);
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
    destinationReceptionAcceptationStatus,
    destinationReceptionWeight,
    destinationReceptionRefusedWeight,
    destinationReceptionAcceptedWeight,
    destinationOperationCodes,
    destinationOperationModes,
    destinationOperationDate
  } = toBsffDestination(bsff.packagings);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsff.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsff.emitterCompanyAddress);

  return {
    ...emptyIncomingWasteV2,
    id: bsff.id,
    source: "BSD",
    publicId: null,
    bsdId: bsff.id,
    reportAsSiret: null,
    createdAt: bsff.createdAt,
    updatedAt: bsff.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationReceptionDate: bsff.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate,
    bsdType: "BSFF",
    bsdSubType: getBsffSubType(bsff),
    customId: null,
    status: bsff.status,
    wasteDescription: bsff.wasteDescription,
    wasteCode: bsff.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toDecimalPlaces(6).toNumber()
      : null,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsff.emitterCompanyMail,
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
    wasteAdr: bsff.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsff.destinationCompanyMail,
    destinationReceptionAcceptationStatus,
    destinationReceptionWeight: destinationReceptionWeight
      ? new Decimal(destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : destinationReceptionWeight,
    destinationReceptionRefusedWeight,
    destinationReceptionAcceptedWeight,
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationOperationCodes,
    destinationOperationModes,
    // >switch to array and destinationOperationModes?
    destinationOperationNoTraceability: false,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    nextOperationCode: null,
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
  bsff: RegistryV2Bsff
): Omit<Required<OutgoingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsff);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsff);
  const {
    nextDestinationPlannedOperationCodes,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsff);
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
    destinationReceptionAcceptationStatus,
    destinationReceptionWeight,
    destinationReceptionRefusedWeight,
    destinationReceptionAcceptedWeight,
    destinationOperationCodes,
    destinationOperationModes,
    destinationOperationDate
  } = toBsffDestination(bsff.packagings);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsff.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsff.emitterCompanyAddress);

  return {
    ...emptyOutgoingWasteV2,
    id: bsff.id,
    source: "BSD",
    publicId: null,
    bsdId: bsff.id,
    reportAsSiret: null,
    createdAt: bsff.createdAt,
    updatedAt: bsff.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationOperationDate,
    bsdType: "BSFF",
    bsdSubType: getBsffSubType(bsff),
    customId: null,
    status: bsff.status,
    wasteDescription: bsff.wasteDescription,
    wasteCode: bsff.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toDecimalPlaces(6).toNumber()
      : null,
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
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsff.emitterCompanyMail,
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
    ecoOrganismeSiret: null,
    ecoOrganismeName: null,
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

    wasteAdr: bsff.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsff.destinationCompanyMail,

    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,
    postTempStorageDestinationName: null,
    postTempStorageDestinationSiret: null,
    postTempStorageDestinationAddress: null,
    postTempStorageDestinationPostalCode: null,
    postTempStorageDestinationCity: null,
    postTempStorageDestinationCountry: null,
    destinationReceptionAcceptationStatus,
    destinationReceptionWeight: destinationReceptionWeight
      ? new Decimal(destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : destinationReceptionWeight,
    destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationOperationCodes,
    destinationOperationModes,
    nextDestinationPlannedOperationCodes,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

const minimalBsffForLookupSelect = {
  id: true,
  destinationReceptionSignatureDate: true,
  destinationCompanySiret: true,
  wasteCode: true,
  emitterCompanySiret: true,
  detenteurCompanySirets: true,
  transporters: {
    select: {
      id: true,
      number: true,
      transporterTransportSignatureDate: true
    }
  }
};

type MinimalBsffForLookup = Prisma.BsffGetPayload<{
  select: typeof minimalBsffForLookupSelect;
}>;

const bsffToLookupCreateInputs = (
  bsff: MinimalBsffForLookup
): Prisma.RegistryLookupUncheckedCreateInput[] => {
  const res: Prisma.RegistryLookupUncheckedCreateInput[] = [];
  const transporter = getFirstTransporterSync(bsff);
  if (bsff.destinationReceptionSignatureDate && bsff.destinationCompanySiret) {
    res.push({
      id: bsff.id,
      readableId: bsff.id,
      siret: bsff.destinationCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsff.wasteCode,
      ...generateDateInfos(bsff.destinationReceptionSignatureDate),
      bsffId: bsff.id
    });
  }
  if (transporter?.transporterTransportSignatureDate) {
    const sirets = new Set([
      bsff.emitterCompanySiret,
      ...bsff.detenteurCompanySirets
    ]);
    sirets.forEach(siret => {
      if (!siret) {
        return;
      }
      res.push({
        id: bsff.id,
        readableId: bsff.id,
        siret,
        exportRegistryType: RegistryExportType.OUTGOING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsff.wasteCode,
        ...generateDateInfos(transporter.transporterTransportSignatureDate!),
        bsffId: bsff.id
      });
    });
  }
  return res;
};

const performRegistryLookupUpdate = async (
  bsff: MinimalBsffForLookup,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await deleteRegistryLookup(bsff.id, tx);
  const lookupInputs = bsffToLookupCreateInputs(bsff);
  if (lookupInputs.length > 0) {
    await tx.registryLookup.createMany({
      data: lookupInputs
    });
  }
};

export const updateRegistryLookup = async (
  bsff: MinimalBsffForLookup,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (!tx) {
    await prisma.$transaction(async transaction => {
      await performRegistryLookupUpdate(bsff, transaction);
    });
  } else {
    await performRegistryLookupUpdate(bsff, tx);
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bsffId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.bsff.findMany({
      where: {
        isDeleted: false,
        isDraft: false
      },
      take: 100,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      },
      select: minimalBsffForLookupSelect
    });
    let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
    for (const bsff of items) {
      const createInputs = bsffToLookupCreateInputs(bsff);
      createArray = createArray.concat(createInputs);
    }
    await prisma.registryLookup.createMany({
      data: createArray
    });
    if (items.length < 100) {
      done = true;
      return;
    }
    cursorId = items[items.length - 1].id;
  }
};

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
