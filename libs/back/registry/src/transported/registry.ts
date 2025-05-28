import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryTransported
} from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  createRegistryLogger,
  deleteRegistryLookup,
  generateDateInfos
} from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { TransportedWasteV2 } from "@td/codegen-back";
import { isDangerous } from "@td/constants";

const getWasteIsDangerous = (
  transportedWaste: Pick<
    RegistryTransported,
    "wasteIsDangerous" | "wastePop" | "wasteCode"
  >
) => {
  return (
    !!transportedWaste.wasteIsDangerous ||
    !!transportedWaste.wastePop ||
    isDangerous(transportedWaste.wasteCode)
  );
};

export const toTransportedWaste = (
  transportedWaste: RegistryTransported
): TransportedWasteV2 => {
  return {
    id: transportedWaste.id,
    source: "REGISTRY",
    publicId: transportedWaste.publicId,
    bsdId: null,
    reportAsSiret: transportedWaste.reportAsCompanySiret,
    createdAt: null,
    updatedAt: null,
    transporterTakenOverAt: transportedWaste.collectionDate,
    unloadingDate: transportedWaste.unloadingDate,
    destinationReceptionDate: null,
    bsdType: null,
    bsdSubType: null,
    customId: null,
    status: null,
    wasteDescription: transportedWaste.wasteDescription,
    wasteCode: transportedWaste.wasteCode,
    wasteCodeBale: transportedWaste.wasteCodeBale,
    wastePop: transportedWaste.wastePop,
    wasteIsDangerous: getWasteIsDangerous(transportedWaste),
    weight: transportedWaste.weightValue,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weightIsEstimate: transportedWaste.weightIsEstimate,
    volume: transportedWaste.volume,

    emitterCompanyIrregularSituation: null,
    emitterCompanySiret: transportedWaste.emitterCompanyOrgId,
    emitterCompanyName: transportedWaste.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress: transportedWaste.emitterCompanyAddress,
    emitterCompanyPostalCode: transportedWaste.emitterCompanyPostalCode,
    emitterCompanyCity: transportedWaste.emitterCompanyCity,
    emitterCompanyCountry: transportedWaste.emitterCompanyCountryCode,
    emitterCompanyMail: null,

    emitterPickupsiteName: transportedWaste.emitterPickupSiteName,
    emitterPickupsiteAddress: transportedWaste.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: transportedWaste.emitterPickupSitePostalCode,
    emitterPickupsiteCity: transportedWaste.emitterPickupSiteCity,
    emitterPickupsiteCountry: transportedWaste.emitterPickupSiteCountryCode,

    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,

    ecoOrganismeSiret: transportedWaste.ecoOrganismeSiret,
    ecoOrganismeName: transportedWaste.ecoOrganismeName,

    brokerCompanyName: transportedWaste.brokerCompanyName,
    brokerCompanySiret: transportedWaste.brokerCompanySiret,
    brokerRecepisseNumber: transportedWaste.brokerRecepisseNumber,
    brokerCompanyMail: null,

    traderCompanyName: transportedWaste.traderCompanyName,
    traderCompanySiret: transportedWaste.traderCompanySiret,
    traderRecepisseNumber: transportedWaste.traderRecepisseNumber,
    traderCompanyMail: null,

    transporter1CompanySiret: transportedWaste.reportForCompanySiret,
    transporter1CompanyName: transportedWaste.reportForCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress: transportedWaste.reportForCompanyAddress,
    transporter1CompanyPostalCode: transportedWaste.reportForCompanyPostalCode,
    transporter1CompanyCity: transportedWaste.reportForCompanyCity,
    transporter1CompanyCountry: "FR",
    transporter1RecepisseIsExempted:
      transportedWaste.reportForRecepisseIsExempted,
    transporter1RecepisseNumber: transportedWaste.reportForRecepisseNumber,
    transporter1TransportMode: transportedWaste.reportForTransportMode,
    transporter1CompanyMail: null,
    transporter1TransportPlates: transportedWaste.reportForTransportPlates,

    wasteAdr: transportedWaste.reportForTransportAdr,
    nonRoadRegulationMention: transportedWaste.reportForTransportOtherTmdCode,

    destinationCap: null,

    destinationCompanySiret: transportedWaste.destinationCompanyOrgId,
    destinationCompanyName: transportedWaste.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress: transportedWaste.destinationCompanyAddress,
    destinationCompanyPostalCode: transportedWaste.destinationCompanyPostalCode,
    destinationCompanyCity: transportedWaste.destinationCompanyCity,
    destinationCompanyCountry: transportedWaste.destinationCompanyCountryCode,
    destinationCompanyMail: null,

    destinationDropSiteAddress: transportedWaste.destinationDropSiteAddress,
    destinationDropSitePostalCode:
      transportedWaste.destinationDropSitePostalCode,
    destinationDropSiteCity: transportedWaste.destinationDropSiteCity,
    destinationDropSiteCountryCode:
      transportedWaste.destinationDropSiteCountryCode,

    destinationReceptionAcceptationStatus: null,
    destinationReceptionWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: null,
    destinationHasCiterneBeenWashedOut: null,

    gistridNumber: transportedWaste.gistridNumber,
    movementNumber: transportedWaste.movementNumber
  };
};

const minimalRegistryForLookupSelect = {
  id: true,
  publicId: true,
  reportForCompanySiret: true,
  reportAsCompanySiret: true,
  wasteIsDangerous: true,
  wasteCode: true,
  wastePop: true,
  collectionDate: true,
  createdAt: true
};

type MinimalRegistryForLookup = Prisma.RegistryTransportedGetPayload<{
  select: typeof minimalRegistryForLookupSelect;
}>;

const registryToLookupCreateInput = (
  registryTransported: MinimalRegistryForLookup
): Prisma.RegistryLookupUncheckedCreateInput => {
  return {
    id: registryTransported.id,
    readableId: registryTransported.publicId,
    siret: registryTransported.reportForCompanySiret,
    reportAsSiret: registryTransported.reportAsCompanySiret,
    exportRegistryType: RegistryExportType.TRANSPORTED,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: getWasteIsDangerous(registryTransported)
      ? RegistryExportWasteType.DD
      : RegistryExportWasteType.DND,
    wasteCode: registryTransported.wasteCode,
    ...generateDateInfos(
      registryTransported.collectionDate,
      registryTransported.createdAt
    ),
    registryTransportedId: registryTransported.id
  };
};

export const updateRegistryLookup = async (
  registryTransported: MinimalRegistryForLookup,
  oldRegistryTransportedId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryTransportedId) {
    await tx.registryLookup.upsert({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // and a specific siret
        idExportTypeAndSiret: {
          id: oldRegistryTransportedId,
          exportRegistryType: RegistryExportType.TRANSPORTED,
          siret: registryTransported.reportForCompanySiret
        }
      },
      update: {
        // only those properties can change during an update
        // the id changes because a new Registry entry is created on each update
        id: registryTransported.id,
        reportAsSiret: registryTransported.reportAsCompanySiret,
        wasteType: getWasteIsDangerous(registryTransported)
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: registryTransported.wasteCode,
        ...generateDateInfos(
          registryTransported.collectionDate,
          registryTransported.createdAt
        ),
        registryTransportedId: registryTransported.id
      },
      create: registryToLookupCreateInput(registryTransported),
      select: {
        id: true
      }
    });
  } else {
    await tx.registryLookup.create({
      data: registryToLookupCreateInput(registryTransported),
      select: {
        id: true
      }
    });
  }
};

export const rebuildRegistryLookup = async (pageSize = 100, threads = 4) => {
  const logger = createRegistryLogger("TRANSPORTED");

  // First, get total count for progress calculation
  const total = await prisma.registryTransported.count({
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
      (registryTransported: MinimalRegistryForLookup) =>
        registryToLookupCreateInput(registryTransported)
    );
    // Run delete and create operations in a transaction
    await prisma.$transaction(async tx => {
      // Delete existing lookups for these items
      await tx.registryLookup.deleteMany({
        where: {
          OR: items.map(item => ({
            id: item.id,
            exportRegistryType: RegistryExportType.TRANSPORTED,
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
    const items = await prisma.registryTransported.findMany({
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
