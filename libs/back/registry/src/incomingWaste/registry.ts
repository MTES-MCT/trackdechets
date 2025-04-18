import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryIncomingWaste
} from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  createRegistryLogger,
  deleteRegistryLookup,
  generateDateInfos
} from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { IncomingWasteV2 } from "@td/codegen-back";
import { isDangerous } from "@td/constants";

const getWasteIsDangerous = (
  incomingWaste: Pick<
    RegistryIncomingWaste,
    "wasteIsDangerous" | "wastePop" | "wasteCode"
  >
) => {
  return (
    !!incomingWaste.wasteIsDangerous ||
    !!incomingWaste.wastePop ||
    isDangerous(incomingWaste.wasteCode)
  );
};

export const toIncomingWaste = (
  incomingWaste: RegistryIncomingWaste
): IncomingWasteV2 => {
  return {
    id: incomingWaste.id,
    source: "REGISTRY",
    publicId: incomingWaste.publicId,
    bsdId: null,
    reportAsSiret: incomingWaste.reportAsCompanySiret,
    createdAt: null,
    updatedAt: null,
    transporterTakenOverAt: null,
    destinationReceptionDate: incomingWaste.receptionDate,
    weighingHour: incomingWaste.weighingHour,
    destinationOperationDate: null,
    bsdType: null,
    bsdSubType: null,
    customId: null,
    status: null,
    wasteDescription: incomingWaste.wasteDescription,
    wasteCode: incomingWaste.wasteCode,
    wasteCodeBale: incomingWaste.wasteCodeBale,
    wastePop: incomingWaste.wastePop,
    wasteIsDangerous: getWasteIsDangerous(incomingWaste),
    weight: null,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    initialEmitterCompanyName: incomingWaste.initialEmitterCompanyName,
    initialEmitterCompanySiret: incomingWaste.initialEmitterCompanyOrgId,
    initialEmitterCompanyAddress: incomingWaste.initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode:
      incomingWaste.initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity: incomingWaste.initialEmitterCompanyCity,
    initialEmitterCompanyCountry:
      incomingWaste.initialEmitterCompanyCountryCode,
    initialEmitterMunicipalitiesInseeCodes:
      incomingWaste.initialEmitterMunicipalitiesInseeCodes,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanyName: incomingWaste.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: incomingWaste.emitterCompanyOrgId,
    emitterCompanyAddress: incomingWaste.emitterCompanyAddress,
    emitterCompanyPostalCode: incomingWaste.emitterCompanyPostalCode,
    emitterCompanyCity: incomingWaste.emitterCompanyCity,
    emitterCompanyCountry: incomingWaste.emitterCompanyCountryCode,
    emitterCompanyMail: null,
    emitterPickupsiteName: incomingWaste.emitterPickupSiteName,
    emitterPickupsiteAddress: incomingWaste.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: incomingWaste.emitterPickupSitePostalCode,
    emitterPickupsiteCity: incomingWaste.emitterPickupSiteCity,
    emitterPickupsiteCountry: incomingWaste.emitterPickupSiteCountryCode,
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
    ecoOrganismeName: incomingWaste.ecoOrganismeName,
    ecoOrganismeSiret: incomingWaste.ecoOrganismeSiret,
    traderCompanyName: incomingWaste.traderCompanyName,
    traderCompanySiret: incomingWaste.traderCompanySiret,
    traderRecepisseNumber: incomingWaste.traderRecepisseNumber,
    traderCompanyMail: null,
    brokerCompanyName: incomingWaste.brokerCompanyName,
    brokerCompanySiret: incomingWaste.brokerCompanySiret,
    brokerRecepisseNumber: incomingWaste.brokerRecepisseNumber,
    brokerCompanyMail: null,
    isDirectSupply: incomingWaste.isDirectSupply,
    transporter1CompanyName: incomingWaste.transporter1CompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: incomingWaste.transporter1CompanyOrgId,
    transporter1CompanyAddress: incomingWaste.transporter1CompanyAddress,
    transporter1CompanyPostalCode: incomingWaste.transporter1CompanyPostalCode,
    transporter1CompanyCity: incomingWaste.transporter1CompanyCity,
    transporter1CompanyCountry: incomingWaste.transporter1CompanyCountryCode,
    transporter1RecepisseIsExempted:
      incomingWaste.transporter1RecepisseIsExempted,
    transporter1RecepisseNumber: incomingWaste.transporter1RecepisseNumber,
    transporter1TransportMode: incomingWaste.transporter1TransportMode,
    transporter1CompanyMail: null,
    transporter2CompanyName: incomingWaste.transporter2CompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanySiret: incomingWaste.transporter2CompanyOrgId,
    transporter2CompanyAddress: incomingWaste.transporter2CompanyAddress,
    transporter2CompanyPostalCode: incomingWaste.transporter2CompanyPostalCode,
    transporter2CompanyCity: incomingWaste.transporter2CompanyCity,
    transporter2CompanyCountry: incomingWaste.transporter2CompanyCountryCode,
    transporter2RecepisseIsExempted:
      incomingWaste.transporter2RecepisseIsExempted,
    transporter2RecepisseNumber: incomingWaste.transporter2RecepisseNumber,
    transporter2TransportMode: incomingWaste.transporter2TransportMode,
    transporter2CompanyMail: null,
    transporter3CompanyName: incomingWaste.transporter3CompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanySiret: incomingWaste.transporter3CompanyOrgId,
    transporter3CompanyAddress: incomingWaste.transporter3CompanyAddress,
    transporter3CompanyPostalCode: incomingWaste.transporter3CompanyPostalCode,
    transporter3CompanyCity: incomingWaste.transporter3CompanyCity,
    transporter3CompanyCountry: incomingWaste.transporter3CompanyCountryCode,
    transporter3RecepisseIsExempted:
      incomingWaste.transporter3RecepisseIsExempted,
    transporter3RecepisseNumber: incomingWaste.transporter3RecepisseNumber,
    transporter3TransportMode: incomingWaste.transporter3TransportMode,
    transporter3CompanyMail: null,
    transporter4CompanyName: incomingWaste.transporter4CompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanySiret: incomingWaste.transporter4CompanyOrgId,
    transporter4CompanyAddress: incomingWaste.transporter4CompanyAddress,
    transporter4CompanyPostalCode: incomingWaste.transporter4CompanyPostalCode,
    transporter4CompanyCity: incomingWaste.transporter4CompanyCity,
    transporter4CompanyCountry: incomingWaste.transporter4CompanyCountryCode,
    transporter4RecepisseIsExempted:
      incomingWaste.transporter4RecepisseIsExempted,
    transporter4RecepisseNumber: incomingWaste.transporter4RecepisseNumber,
    transporter4TransportMode: incomingWaste.transporter4TransportMode,
    transporter4CompanyMail: null,
    transporter5CompanyName: incomingWaste.transporter5CompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanySiret: incomingWaste.transporter5CompanyOrgId,
    transporter5CompanyAddress: incomingWaste.transporter5CompanyAddress,
    transporter5CompanyPostalCode: incomingWaste.transporter5CompanyPostalCode,
    transporter5CompanyCity: incomingWaste.transporter5CompanyCity,
    transporter5CompanyCountry: incomingWaste.transporter5CompanyCountryCode,
    transporter5RecepisseIsExempted:
      incomingWaste.transporter5RecepisseIsExempted,
    transporter5RecepisseNumber: incomingWaste.transporter5RecepisseNumber,
    transporter5TransportMode: incomingWaste.transporter5TransportMode,
    transporter5CompanyMail: null,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: incomingWaste.reportForCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: incomingWaste.reportForCompanySiret,
    destinationCompanyAddress: incomingWaste.reportForCompanyAddress,
    destinationCompanyPostalCode: incomingWaste.reportForCompanyPostalCode,
    destinationCompanyCity: incomingWaste.reportForCompanyCity,
    destinationCompanyMail: null,
    destinationReceptionAcceptationStatus: null,
    destinationReceptionWeight: null,
    destinationReceptionRefusedWeight: null,
    destinationReceptionAcceptedWeight: incomingWaste.weightValue,
    destinationReceptionWeightIsEstimate: incomingWaste.weightIsEstimate,
    destinationReceptionVolume: incomingWaste.volume,
    destinationPlannedOperationCode: null,
    destinationOperationModes: incomingWaste.operationMode
      ? [incomingWaste.operationMode]
      : null,
    destinationOperationCodes: incomingWaste.operationCode
      ? [incomingWaste.operationCode]
      : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: incomingWaste.noTraceability,
    ttdImportNumber: incomingWaste.ttdImportNumber,
    movementNumber: incomingWaste.movementNumber,
    nextOperationCode: incomingWaste.nextOperationCode,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

const minimalRegistryForLookupSelect = {
  id: true,
  publicId: true,
  reportForCompanySiret: true,
  reportAsCompanySiret: true,
  wasteIsDangerous: true,
  wastePop: true,
  wasteCode: true,
  receptionDate: true
};

type MinimalRegistryForLookup = Prisma.RegistryIncomingWasteGetPayload<{
  select: typeof minimalRegistryForLookupSelect;
}>;

const registryToLookupCreateInput = (
  registryIncomingWaste: MinimalRegistryForLookup
): Prisma.RegistryLookupUncheckedCreateInput => {
  return {
    id: registryIncomingWaste.id,
    readableId: registryIncomingWaste.publicId,
    siret: registryIncomingWaste.reportForCompanySiret,
    reportAsSiret: registryIncomingWaste.reportAsCompanySiret,
    exportRegistryType: RegistryExportType.INCOMING,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: getWasteIsDangerous(registryIncomingWaste)
      ? RegistryExportWasteType.DD
      : RegistryExportWasteType.DND,
    wasteCode: registryIncomingWaste.wasteCode,
    ...generateDateInfos(registryIncomingWaste.receptionDate),
    registryIncomingWasteId: registryIncomingWaste.id
  };
};

export const updateRegistryLookup = async (
  registryIncomingWaste: MinimalRegistryForLookup,
  oldRegistryIncomingWasteId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryIncomingWasteId) {
    await tx.registryLookup.upsert({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // and a specific siret
        idExportTypeAndSiret: {
          id: oldRegistryIncomingWasteId,
          exportRegistryType: RegistryExportType.INCOMING,
          siret: registryIncomingWaste.reportForCompanySiret
        }
      },
      update: {
        // only those properties can change during an update
        // the id changes because a new Registry entry is created on each update
        id: registryIncomingWaste.id,
        reportAsSiret: registryIncomingWaste.reportAsCompanySiret,
        wasteType: getWasteIsDangerous(registryIncomingWaste)
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: registryIncomingWaste.wasteCode,
        ...generateDateInfos(registryIncomingWaste.receptionDate),
        registryIncomingWasteId: registryIncomingWaste.id
      },
      create: registryToLookupCreateInput(registryIncomingWaste),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  } else {
    await tx.registryLookup.create({
      data: registryToLookupCreateInput(registryIncomingWaste),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  }
};

export const rebuildRegistryLookup = async (pageSize = 100) => {
  const logger = createRegistryLogger("INCOMING_WASTE");
  await prisma.registryLookup.deleteMany({
    where: {
      registryIncomingWasteId: { not: null }
    }
  });
  logger.logDelete();

  const total = await prisma.registryIncomingWaste.count({
    where: {
      isCancelled: false,
      isLatest: true
    }
  });
  let done = false;
  let cursorId: string | null = null;
  let processedCount = 0;
  while (!done) {
    const items = await prisma.registryIncomingWaste.findMany({
      where: {
        isCancelled: false,
        isLatest: true
      },
      take: pageSize,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      },
      select: minimalRegistryForLookupSelect
    });
    const createArray = items.map(
      (registryIncomingWaste: MinimalRegistryForLookup) =>
        registryToLookupCreateInput(registryIncomingWaste)
    );
    await prisma.registryLookup.createMany({
      data: createArray,
      skipDuplicates: true
    });
    processedCount += items.length;
    logger.logProgress(processedCount, total);
    if (items.length < pageSize) {
      done = true;
      break;
    }
    cursorId = items[items.length - 1].id;
  }
  logger.logCompletion(processedCount);
};

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
