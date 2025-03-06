import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryManaged
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { deleteRegistryLookup, generateDateInfos } from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { ManagedWasteV2 } from "@td/codegen-back";

export const toManagedWaste = (
  managedWaste: RegistryManaged
): ManagedWasteV2 => {
  return {
    id: managedWaste.id,
    source: "REGISTRY",
    publicId: managedWaste.publicId,
    bsdId: null,
    reportAsSiret: managedWaste.reportAsCompanySiret,
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
    wasteIsDangerous: managedWaste.wasteIsDangerous,
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

    declarationNumber: managedWaste.declarationNumber,
    notificationNumber: managedWaste.notificationNumber,
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
  managingStartDate: true
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
    wasteType: registryManaged.wasteIsDangerous
      ? RegistryExportWasteType.DD
      : RegistryExportWasteType.DND,
    wasteCode: registryManaged.wasteCode,
    ...generateDateInfos(registryManaged.managingStartDate),
    registryManagedId: registryManaged.id
  };
};

export const updateRegistryLookup = async (
  registryManagedWaste: MinimalRegistryForLookup,
  oldRegistryManagedWasteId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryManagedWasteId) {
    // note for future implementations:
    // if there is a possibility that the siret changes between updates (BSDs),
    // you should use an upsert.
    // This is because the index would point to an empty lookup in that case, so we need to create it.
    // the cleanup method will remove the lookup with the old siret afterward
    await tx.registryLookup.update({
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
      data: {
        // only those properties can change during an update
        // the id changes because a new RegistrySsd entry is created on each update
        id: registryManagedWaste.id,
        reportAsSiret: registryManagedWaste.reportAsCompanySiret,
        wasteType: registryManagedWaste.wasteIsDangerous
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: registryManagedWaste.wasteCode,
        ...generateDateInfos(registryManagedWaste.managingStartDate),
        registryManagedId: registryManagedWaste.id
      },
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

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      registryManagedId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.registryManaged.findMany({
      where: {
        isCancelled: false,
        isLatest: true
      },
      take: 100,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      },
      select: minimalRegistryForLookupSelect
    });
    const createArray = items.map((registryManaged: MinimalRegistryForLookup) =>
      registryToLookupCreateInput(registryManaged)
    );
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
