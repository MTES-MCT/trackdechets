import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { IncomingWasteV2, OutgoingWasteV2 } from "@td/codegen-back";
import { getWasteDescription } from "./utils";
import { getBsvhuSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import Decimal from "decimal.js";
import {
  emptyIncomingWasteV2,
  emptyOutgoingWasteV2,
  RegistryV2Bsvhu
} from "../registryV2/types";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";

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
    updatedAt: bsvhu.createdAt,
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
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
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
    updatedAt: bsvhu.createdAt,
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
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

const minimalBsvhuForLookupSelect = {
  id: true,
  destinationOperationSignatureDate: true,
  destinationCompanySiret: true,
  transporterTransportSignatureDate: true,
  emitterCompanySiret: true,
  ecoOrganismeSiret: true,
  wasteCode: true
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
      ...generateDateInfos(bsvhu.destinationOperationSignatureDate),
      bsvhuId: bsvhu.id
    });
  }
  if (bsvhu.transporterTransportSignatureDate) {
    const sirets = new Set([
      bsvhu.emitterCompanySiret,
      bsvhu.ecoOrganismeSiret
    ]);
    sirets.forEach(siret => {
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
        ...generateDateInfos(bsvhu.transporterTransportSignatureDate!),
        bsvhuId: bsvhu.id
      });
    });
  }
  return res;
};

const performRegistryLookupUpdate = async (
  bsvhu: MinimalBsvhuForLookup,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await deleteRegistryLookup(bsvhu.id, tx);
  const lookupInputs = bsvhuToLookupCreateInputs(bsvhu);
  if (lookupInputs.length > 0) {
    await tx.registryLookup.createMany({
      data: lookupInputs
    });
  }
};

export const updateRegistryLookup = async (
  bsvhu: MinimalBsvhuForLookup,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (!tx) {
    await prisma.$transaction(async transaction => {
      await performRegistryLookupUpdate(bsvhu, transaction);
    });
  } else {
    await performRegistryLookupUpdate(bsvhu, tx);
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bsvhuId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.bsvhu.findMany({
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
      select: minimalBsvhuForLookupSelect
    });
    let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
    for (const bsvhu of items) {
      const createInputs = bsvhuToLookupCreateInputs(bsvhu);
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
