import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryIncomingTexs
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

export const toIncomingWaste = (
  incomingTexs: RegistryIncomingTexs
): IncomingWasteV2 => {
  return {
    id: incomingTexs.id,
    source: "REGISTRY",
    publicId: incomingTexs.publicId,
    bsdId: null,
    reportAsSiret: incomingTexs.reportAsCompanySiret,
    createdAt: null,
    updatedAt: null,
    transporterTakenOverAt: null,
    destinationReceptionDate: incomingTexs.receptionDate,
    weighingHour: null,
    destinationOperationDate: null,
    bsdType: null,
    bsdSubType: null,
    customId: null,
    status: null,
    wasteDescription: incomingTexs.wasteDescription,
    wasteCode: incomingTexs.wasteCode,
    wasteIsDangerous:
      !!incomingTexs.wasteIsDangerous ||
      !!incomingTexs.wastePop ||
      isDangerous(incomingTexs.wasteCode),
    wastePop: incomingTexs.wastePop,
    wasteCodeBale: incomingTexs.wasteCodeBale,
    weight: null,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    initialEmitterCompanyName: incomingTexs.initialEmitterCompanyName,
    initialEmitterCompanySiret: incomingTexs.initialEmitterCompanyOrgId,
    initialEmitterCompanyAddress: incomingTexs.initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode:
      incomingTexs.initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity: incomingTexs.initialEmitterCompanyCity,
    initialEmitterCompanyCountry: incomingTexs.initialEmitterCompanyCountryCode,
    initialEmitterMunicipalitiesInseeCodes:
      incomingTexs.initialEmitterMunicipalitiesInseeCodes,
    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanyName: incomingTexs.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: incomingTexs.emitterCompanyOrgId,
    emitterCompanyAddress: incomingTexs.emitterCompanyAddress,
    emitterCompanyPostalCode: incomingTexs.emitterCompanyPostalCode,
    emitterCompanyCity: incomingTexs.emitterCompanyCity,
    emitterCompanyCountry: incomingTexs.emitterCompanyCountryCode,
    emitterCompanyMail: null,
    emitterPickupsiteName: incomingTexs.emitterPickupSiteName,
    emitterPickupsiteAddress: incomingTexs.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: incomingTexs.emitterPickupSitePostalCode,
    emitterPickupsiteCity: incomingTexs.emitterPickupSiteCity,
    emitterPickupsiteCountry: incomingTexs.emitterPickupSiteCountryCode,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: incomingTexs.parcelInseeCodes,
    parcelNumbers: incomingTexs.parcelNumbers,
    parcelCoordinates: incomingTexs.parcelCoordinates,
    sisIdentifiers: incomingTexs.sisIdentifier
      ? [incomingTexs.sisIdentifier]
      : null,
    ecoOrganismeName: incomingTexs.ecoOrganismeName,
    ecoOrganismeSiret: incomingTexs.ecoOrganismeSiret,
    traderCompanyName: incomingTexs.traderCompanyName,
    traderCompanySiret: incomingTexs.traderCompanySiret,
    traderRecepisseNumber: incomingTexs.traderRecepisseNumber,
    traderCompanyMail: null,
    brokerCompanyName: incomingTexs.brokerCompanyName,
    brokerCompanySiret: incomingTexs.brokerCompanySiret,
    brokerRecepisseNumber: incomingTexs.brokerRecepisseNumber,
    brokerCompanyMail: null,
    isDirectSupply: incomingTexs.isDirectSupply,
    transporter1CompanyName: incomingTexs.transporter1CompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: incomingTexs.transporter1CompanyOrgId,
    transporter1CompanyAddress: incomingTexs.transporter1CompanyAddress,
    transporter1CompanyPostalCode: incomingTexs.transporter1CompanyPostalCode,
    transporter1CompanyCity: incomingTexs.transporter1CompanyCity,
    transporter1CompanyCountry: incomingTexs.transporter1CompanyCountryCode,
    transporter1RecepisseIsExempted:
      incomingTexs.transporter1RecepisseIsExempted,
    transporter1RecepisseNumber: incomingTexs.transporter1RecepisseNumber,
    transporter1TransportMode: incomingTexs.transporter1TransportMode,
    transporter1CompanyMail: null,
    transporter2CompanyName: incomingTexs.transporter2CompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanySiret: incomingTexs.transporter2CompanyOrgId,
    transporter2CompanyAddress: incomingTexs.transporter2CompanyAddress,
    transporter2CompanyPostalCode: incomingTexs.transporter2CompanyPostalCode,
    transporter2CompanyCity: incomingTexs.transporter2CompanyCity,
    transporter2CompanyCountry: incomingTexs.transporter2CompanyCountryCode,
    transporter2RecepisseIsExempted:
      incomingTexs.transporter2RecepisseIsExempted,
    transporter2RecepisseNumber: incomingTexs.transporter2RecepisseNumber,
    transporter2TransportMode: incomingTexs.transporter2TransportMode,
    transporter2CompanyMail: null,
    transporter3CompanyName: incomingTexs.transporter3CompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanySiret: incomingTexs.transporter3CompanyOrgId,
    transporter3CompanyAddress: incomingTexs.transporter3CompanyAddress,
    transporter3CompanyPostalCode: incomingTexs.transporter3CompanyPostalCode,
    transporter3CompanyCity: incomingTexs.transporter3CompanyCity,
    transporter3CompanyCountry: incomingTexs.transporter3CompanyCountryCode,
    transporter3RecepisseIsExempted:
      incomingTexs.transporter3RecepisseIsExempted,
    transporter3RecepisseNumber: incomingTexs.transporter3RecepisseNumber,
    transporter3TransportMode: incomingTexs.transporter3TransportMode,
    transporter3CompanyMail: null,
    transporter4CompanyName: incomingTexs.transporter4CompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanySiret: incomingTexs.transporter4CompanyOrgId,
    transporter4CompanyAddress: incomingTexs.transporter4CompanyAddress,
    transporter4CompanyPostalCode: incomingTexs.transporter4CompanyPostalCode,
    transporter4CompanyCity: incomingTexs.transporter4CompanyCity,
    transporter4CompanyCountry: incomingTexs.transporter4CompanyCountryCode,
    transporter4RecepisseIsExempted:
      incomingTexs.transporter4RecepisseIsExempted,
    transporter4RecepisseNumber: incomingTexs.transporter4RecepisseNumber,
    transporter4TransportMode: incomingTexs.transporter4TransportMode,
    transporter4CompanyMail: null,
    transporter5CompanyName: incomingTexs.transporter5CompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanySiret: incomingTexs.transporter5CompanyOrgId,
    transporter5CompanyAddress: incomingTexs.transporter5CompanyAddress,
    transporter5CompanyPostalCode: incomingTexs.transporter5CompanyPostalCode,
    transporter5CompanyCity: incomingTexs.transporter5CompanyCity,
    transporter5CompanyCountry: incomingTexs.transporter5CompanyCountryCode,
    transporter5RecepisseIsExempted:
      incomingTexs.transporter5RecepisseIsExempted,
    transporter5RecepisseNumber: incomingTexs.transporter5RecepisseNumber,
    transporter5TransportMode: incomingTexs.transporter5TransportMode,
    transporter5CompanyMail: null,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: incomingTexs.wasteDap,
    destinationCompanyName: incomingTexs.reportForCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: incomingTexs.reportForCompanySiret,
    destinationCompanyAddress: incomingTexs.reportForCompanyAddress,
    destinationCompanyPostalCode: incomingTexs.reportForCompanyPostalCode,
    destinationCompanyCity: incomingTexs.reportForCompanyCity,
    destinationCompanyMail: null,
    destinationReceptionAcceptationStatus: null,
    destinationReceptionWeight: null,
    destinationReceptionRefusedWeight: null,
    destinationReceptionAcceptedWeight: incomingTexs.weightValue,
    destinationReceptionWeightIsEstimate: incomingTexs.weightIsEstimate,
    destinationReceptionVolume: incomingTexs.volume,
    destinationPlannedOperationCode: null,
    destinationOperationModes: incomingTexs.operationMode
      ? [incomingTexs.operationMode]
      : null,
    destinationOperationCodes: incomingTexs.operationCode
      ? [incomingTexs.operationCode]
      : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: incomingTexs.noTraceability,
    ttdImportNumber: incomingTexs.ttdImportNumber,
    movementNumber: incomingTexs.movementNumber,
    nextOperationCode: incomingTexs.nextOperationCode,
    isUpcycled: incomingTexs.isUpcycled,
    destinationParcelInseeCodes: incomingTexs.destinationParcelInseeCodes,
    destinationParcelNumbers: incomingTexs.destinationParcelNumbers,
    destinationParcelCoordinates: incomingTexs.destinationParcelCoordinates
  };
};

const minimalRegistryForLookupSelect = {
  id: true,
  createdAt: true,
  publicId: true,
  reportForCompanySiret: true,
  reportAsCompanySiret: true,
  wasteCode: true,
  receptionDate: true
};

type MinimalRegistryForLookup = Prisma.RegistryIncomingTexsGetPayload<{
  select: typeof minimalRegistryForLookupSelect;
}>;

const registryToLookupCreateInput = (
  registryIncomingTexs: MinimalRegistryForLookup
): Prisma.RegistryLookupUncheckedCreateInput => {
  return {
    id: registryIncomingTexs.id,
    readableId: registryIncomingTexs.publicId,
    siret: registryIncomingTexs.reportForCompanySiret,
    reportAsSiret: registryIncomingTexs.reportAsCompanySiret,
    exportRegistryType: RegistryExportType.INCOMING,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: RegistryExportWasteType.TEXS,
    wasteCode: registryIncomingTexs.wasteCode,
    ...generateDateInfos(
      registryIncomingTexs.receptionDate,
      registryIncomingTexs.createdAt
    ),
    registryIncomingTexsId: registryIncomingTexs.id
  };
};

export const updateRegistryLookup = async (
  registryIncomingTexs: MinimalRegistryForLookup,
  oldRegistryIncomingTexsId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryIncomingTexsId) {
    await tx.registryLookup.upsert({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // and a specific siret
        idExportTypeAndSiret: {
          id: oldRegistryIncomingTexsId,
          exportRegistryType: RegistryExportType.INCOMING,
          siret: registryIncomingTexs.reportForCompanySiret
        }
      },
      update: {
        // only those properties can change during an update
        // the id changes because a new Registry entry is created on each update
        id: registryIncomingTexs.id,
        reportAsSiret: registryIncomingTexs.reportAsCompanySiret,
        wasteCode: registryIncomingTexs.wasteCode,
        ...generateDateInfos(
          registryIncomingTexs.receptionDate,
          registryIncomingTexs.createdAt
        ),
        registryIncomingTexsId: registryIncomingTexs.id
      },
      create: registryToLookupCreateInput(registryIncomingTexs),
      select: {
        id: true
      }
    });
  } else {
    await tx.registryLookup.create({
      data: registryToLookupCreateInput(registryIncomingTexs),
      select: {
        id: true
      }
    });
  }
};

export const rebuildRegistryLookup = async (pageSize = 100, threads = 4) => {
  const logger = createRegistryLogger("INCOMING_TEXS");

  // First, get total count for progress calculation
  const total = await prisma.registryIncomingTexs.count({
    where: {
      isCancelled: false,
      isLatest: true
    }
  });

  let done = false;
  let cursorId: string | null = null;
  let processedCount = 0;
  let operationId = 0;
  const pendingWrites = new Map<number, Promise<void>>();

  const processWrite = async (items: MinimalRegistryForLookup[]) => {
    const createArray = items.map(
      (registryIncomingTexs: MinimalRegistryForLookup) =>
        registryToLookupCreateInput(registryIncomingTexs)
    );
    // Run delete and create operations in a transaction
    await prisma.$transaction(async tx => {
      // Delete existing lookups for these items
      await tx.registryLookup.deleteMany({
        where: {
          OR: items.map(item => ({
            id: item.id,
            exportRegistryType: RegistryExportType.INCOMING,
            siret: item.reportForCompanySiret
          }))
        }
      });

      await tx.registryLookup.createMany({
        data: createArray,
        skipDuplicates: true
      });
    });

    processedCount += items.length;
    logger.logProgress(processedCount, total, pendingWrites.size);
  };

  while (!done) {
    // Sequential read
    const items = await prisma.registryIncomingTexs.findMany({
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
