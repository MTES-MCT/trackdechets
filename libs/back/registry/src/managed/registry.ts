import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryManaged
} from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  createRegistryLogger,
  deleteRegistryLookup,
  generateDateInfos
} from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { ManagedWasteV2 } from "@td/codegen-back";
import { isDangerous } from "@td/constants";

const getWasteIsDangerous = (
  managedWaste: Pick<
    RegistryManaged,
    "wasteIsDangerous" | "wastePop" | "wasteCode"
  >
) => {
  return (
    !!managedWaste.wasteIsDangerous ||
    !!managedWaste.wastePop ||
    isDangerous(managedWaste.wasteCode)
  );
};

export const toManagedWaste = (
  managedWaste: RegistryManaged
): ManagedWasteV2 => {
  return {
    id: managedWaste.id,
    source: "REGISTRY",
    publicId: managedWaste.publicId,
    bsdId: null,
    reportAsSiret: managedWaste.reportAsCompanySiret,
    reportForSiret: managedWaste.reportForCompanySiret,
    createdAt: null,
    updatedAt: null,
    transporterTakenOverAt: null,
    destinationOperationDate: null,
    bsdType: null,
    bsdSubType: null,
    customId: null,
    status: null,
    wasteDescription: managedWaste.wasteDescription,
    wasteCode: managedWaste.wasteCode,
    wasteCodeBale: managedWaste.wasteCodeBale,
    wastePop: managedWaste.wastePop,
    wasteIsDangerous: getWasteIsDangerous(managedWaste),
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: managedWaste.weightValue,
    weightIsEstimate: managedWaste.weightIsEstimate,
    volume: managedWaste.volume,
    managingStartDate: managedWaste.managingStartDate,
    managingEndDate: managedWaste.managingEndDate,
    initialEmitterCompanySiret: managedWaste.initialEmitterCompanyOrgId,
    initialEmitterCompanyName: managedWaste.initialEmitterCompanyName,
    initialEmitterCompanyAddress: managedWaste.initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode:
      managedWaste.initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity: managedWaste.initialEmitterCompanyCity,
    initialEmitterCompanyCountry: managedWaste.initialEmitterCompanyCountryCode,
    initialEmitterMunicipalitiesInseeCodes:
      managedWaste.initialEmitterMunicipalitiesInseeCodes,

    emitterCompanyIrregularSituation: null,
    emitterCompanyType: managedWaste.emitterCompanyType,
    emitterCompanySiret: managedWaste.emitterCompanyOrgId,
    emitterCompanyName: managedWaste.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress: managedWaste.emitterCompanyAddress,
    emitterCompanyPostalCode: managedWaste.emitterCompanyPostalCode,
    emitterCompanyCity: managedWaste.emitterCompanyCity,
    emitterCompanyCountry: managedWaste.emitterCompanyCountryCode,
    emitterCompanyMail: null,
    emitterPickupsiteName: managedWaste.emitterPickupSiteName,
    emitterPickupsiteAddress: managedWaste.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: managedWaste.emitterPickupSitePostalCode,
    emitterPickupsiteCity: managedWaste.emitterPickupSiteCity,
    emitterPickupsiteCountry: managedWaste.emitterPickupSiteCountryCode,
    tempStorerCompanyOrgId: managedWaste.tempStorerCompanyOrgId,
    tempStorerCompanyName: managedWaste.tempStorerCompanyName,
    tempStorerCompanyAddress: managedWaste.tempStorerCompanyAddress,
    tempStorerCompanyPostalCode: managedWaste.tempStorerCompanyPostalCode,
    tempStorerCompanyCity: managedWaste.tempStorerCompanyCity,
    tempStorerCompanyCountryCode: managedWaste.tempStorerCompanyCountryCode,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: managedWaste.parcelInseeCodes,
    parcelNumbers: managedWaste.parcelNumbers,
    parcelCoordinates: managedWaste.parcelCoordinates,
    sisIdentifiers: [managedWaste.sisIdentifier],

    ecoOrganismeSiret: managedWaste.ecoOrganismeSiret,
    ecoOrganismeName: managedWaste.ecoOrganismeName,

    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    brokerCompanyMail: null,

    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    traderCompanyMail: null,

    isDirectSupply: managedWaste.isDirectSupply,

    transporter1CompanySiret: managedWaste.transporter1CompanyOrgId,
    transporter1CompanyName: managedWaste.transporter1CompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress: managedWaste.transporter1CompanyAddress,
    transporter1CompanyPostalCode: managedWaste.transporter1CompanyPostalCode,
    transporter1CompanyCity: managedWaste.transporter1CompanyCity,
    transporter1CompanyCountry: managedWaste.transporter1CompanyCountryCode,
    transporter1RecepisseIsExempted:
      managedWaste.transporter1RecepisseIsExempted,
    transporter1RecepisseNumber: managedWaste.transporter1RecepisseNumber,
    transporter1TransportMode: managedWaste.transporter1TransportMode,
    transporter1CompanyMail: null,

    transporter2CompanySiret: managedWaste.transporter2CompanyOrgId,
    transporter2CompanyName: managedWaste.transporter2CompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress: managedWaste.transporter2CompanyAddress,
    transporter2CompanyPostalCode: managedWaste.transporter2CompanyPostalCode,
    transporter2CompanyCity: managedWaste.transporter2CompanyCity,
    transporter2CompanyCountry: managedWaste.transporter2CompanyCountryCode,
    transporter2RecepisseIsExempted:
      managedWaste.transporter2RecepisseIsExempted,
    transporter2RecepisseNumber: managedWaste.transporter2RecepisseNumber,
    transporter2TransportMode: managedWaste.transporter2TransportMode,
    transporter2CompanyMail: null,

    transporter3CompanySiret: managedWaste.transporter3CompanyOrgId,
    transporter3CompanyName: managedWaste.transporter3CompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress: managedWaste.transporter3CompanyAddress,
    transporter3CompanyPostalCode: managedWaste.transporter3CompanyPostalCode,
    transporter3CompanyCity: managedWaste.transporter3CompanyCity,
    transporter3CompanyCountry: managedWaste.transporter3CompanyCountryCode,
    transporter3RecepisseIsExempted:
      managedWaste.transporter3RecepisseIsExempted,
    transporter3RecepisseNumber: managedWaste.transporter3RecepisseNumber,
    transporter3TransportMode: managedWaste.transporter3TransportMode,
    transporter3CompanyMail: null,

    transporter4CompanySiret: managedWaste.transporter4CompanyOrgId,
    transporter4CompanyName: managedWaste.transporter4CompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress: managedWaste.transporter4CompanyAddress,
    transporter4CompanyPostalCode: managedWaste.transporter4CompanyPostalCode,
    transporter4CompanyCity: managedWaste.transporter4CompanyCity,
    transporter4CompanyCountry: managedWaste.transporter4CompanyCountryCode,
    transporter4RecepisseIsExempted:
      managedWaste.transporter4RecepisseIsExempted,
    transporter4RecepisseNumber: managedWaste.transporter4RecepisseNumber,
    transporter4TransportMode: managedWaste.transporter4TransportMode,
    transporter4CompanyMail: null,

    transporter5CompanySiret: managedWaste.transporter5CompanyOrgId,
    transporter5CompanyName: managedWaste.transporter5CompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress: managedWaste.transporter5CompanyAddress,
    transporter5CompanyPostalCode: managedWaste.transporter5CompanyPostalCode,
    transporter5CompanyCity: managedWaste.transporter5CompanyCity,
    transporter5CompanyCountry: managedWaste.transporter5CompanyCountryCode,
    transporter5RecepisseIsExempted:
      managedWaste.transporter5RecepisseIsExempted,
    transporter5RecepisseNumber: managedWaste.transporter5RecepisseNumber,
    transporter5TransportMode: managedWaste.transporter5TransportMode,
    transporter5CompanyMail: null,

    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: managedWaste.wasteDap,

    destinationCompanySiret: managedWaste.destinationCompanyOrgId,
    destinationCompanyName: managedWaste.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress: managedWaste.destinationCompanyAddress,
    destinationCompanyPostalCode: managedWaste.destinationCompanyPostalCode,
    destinationCompanyCity: managedWaste.destinationCompanyCity,
    destinationCompanyCountry: managedWaste.destinationCompanyCountryCode,
    destinationCompanyMail: null,

    destinationDropSiteAddress: managedWaste.destinationDropSiteAddress,
    destinationDropSitePostalCode: managedWaste.destinationDropSitePostalCode,
    destinationDropSiteCity: managedWaste.destinationDropSiteCity,
    destinationDropSiteCountryCode: managedWaste.destinationDropSiteCountryCode,

    destinationReceptionAcceptationStatus: null,
    destinationReceptionWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: null,

    destinationPlannedOperationCode: managedWaste.operationCode,
    destinationPlannedOperationMode: managedWaste.operationMode,
    destinationOperationCodes: null,
    destinationOperationModes: null,
    nextDestinationPlannedOperationCodes: null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: null,

    destinationFinalOperationCompanySirets: null,
    destinationFinalOperationCodes: null,
    destinationFinalOperationWeights: null,

    gistridNumber: managedWaste.gistridNumber,
    movementNumber: managedWaste.movementNumber,
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
  wasteCode: true,
  wastePop: true,
  managingStartDate: true,
  createdAt: true
};

type MinimalRegistryForLookup = Prisma.RegistryManagedGetPayload<{
  select: typeof minimalRegistryForLookupSelect;
}>;

const registryToLookupCreateInput = (
  registryManaged: MinimalRegistryForLookup
): Prisma.RegistryLookupUncheckedCreateInput => {
  return {
    id: registryManaged.id,
    readableId: registryManaged.publicId,
    siret: registryManaged.reportForCompanySiret,
    reportAsSiret: registryManaged.reportAsCompanySiret,
    exportRegistryType: RegistryExportType.MANAGED,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: getWasteIsDangerous(registryManaged)
      ? RegistryExportWasteType.DD
      : RegistryExportWasteType.DND,
    wasteCode: registryManaged.wasteCode,
    ...generateDateInfos(
      registryManaged.managingStartDate,
      registryManaged.createdAt
    ),
    registryManagedId: registryManaged.id
  };
};

export const updateRegistryLookup = async (
  registryManagedWaste: MinimalRegistryForLookup,
  oldRegistryManagedWasteId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryManagedWasteId) {
    await tx.registryLookup.upsert({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // and a specific siret
        // this is not strictly necessary on SSDs since they only appear in one export registry, for one siret
        // but is necessary on other types of registries that appear for multiple actors/ export registries
        idExportTypeAndSiret: {
          id: oldRegistryManagedWasteId,
          exportRegistryType: RegistryExportType.MANAGED,
          siret: registryManagedWaste.reportForCompanySiret
        }
      },
      update: {
        // only those properties can change during an update
        // the id changes because a new Registry entry is created on each update
        id: registryManagedWaste.id,
        reportAsSiret: registryManagedWaste.reportAsCompanySiret,
        wasteType: getWasteIsDangerous(registryManagedWaste)
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: registryManagedWaste.wasteCode,
        ...generateDateInfos(
          registryManagedWaste.managingStartDate,
          registryManagedWaste.createdAt
        ),
        registryManagedId: registryManagedWaste.id
      },
      create: registryToLookupCreateInput(registryManagedWaste),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  } else {
    await tx.registryLookup.create({
      data: registryToLookupCreateInput(registryManagedWaste),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  }
};

export const rebuildRegistryLookup = async (pageSize = 100, threads = 4) => {
  const logger = createRegistryLogger("MANAGED");

  // First, get total count for progress calculation
  const total = await prisma.registryManaged.count({
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
    const createArray = items.map((registryManaged: MinimalRegistryForLookup) =>
      registryToLookupCreateInput(registryManaged)
    );

    // Run delete and create operations in a transaction
    await prisma.$transaction(async tx => {
      // Delete existing lookups for these items
      await tx.registryLookup.deleteMany({
        where: {
          OR: items.map(item => ({
            id: item.id,
            exportRegistryType: RegistryExportType.MANAGED,
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
    const items = await prisma.registryManaged.findMany({
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
