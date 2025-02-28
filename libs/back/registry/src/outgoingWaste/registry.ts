import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryOutgoingWaste
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { deleteRegistryLookup, generateDateInfos } from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { OutgoingWasteV2 } from "@td/codegen-back";

export const toOutgoingWaste = (
  outgoingWaste: RegistryOutgoingWaste
): OutgoingWasteV2 => {
  return {
    id: outgoingWaste.id,
    source: "REGISTRY",
    publicId: outgoingWaste.publicId,
    bsdId: null,
    reportAsSiret: outgoingWaste.reportAsCompanySiret,
    createdAt: null,
    updatedAt: null,
    transporterTakenOverAt: outgoingWaste.dispatchDate,
    destinationOperationDate: null,
    bsdType: null,
    bsdSubType: null,
    customId: null,
    status: null,
    wasteDescription: outgoingWaste.wasteDescription,
    wasteCode: outgoingWaste.wasteCode,
    wasteCodeBale: outgoingWaste.wasteCodeBale,
    wastePop: outgoingWaste.wastePop,
    wasteIsDangerous: outgoingWaste.wasteIsDangerous,
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: outgoingWaste.weightValue,
    weightIsEstimate: outgoingWaste.weightIsEstimate,
    volume: outgoingWaste.volume,

    initialEmitterCompanySiret: outgoingWaste.initialEmitterCompanyOrgId,
    initialEmitterCompanyName: outgoingWaste.initialEmitterCompanyName,
    initialEmitterCompanyAddress: outgoingWaste.initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode:
      outgoingWaste.initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity: outgoingWaste.initialEmitterCompanyCity,
    initialEmitterCompanyCountry:
      outgoingWaste.initialEmitterCompanyCountryCode,
    initialEmitterMunicipalitiesInseeCodes:
      outgoingWaste.initialEmitterMunicipalitiesInseeCodes,

    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanySiret: outgoingWaste.reportForCompanySiret,
    emitterCompanyName: outgoingWaste.reportForCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress: outgoingWaste.reportForCompanyAddress,
    emitterCompanyPostalCode: outgoingWaste.reportForCompanyPostalCode,
    emitterCompanyCity: outgoingWaste.reportForCompanyCity,
    emitterCompanyCountry: null,
    emitterCompanyMail: null,
    emitterPickupsiteName: outgoingWaste.reportForPickupSiteName,
    emitterPickupsiteAddress: outgoingWaste.reportForPickupSiteAddress,
    emitterPickupsitePostalCode: outgoingWaste.reportForPickupSitePostalCode,
    emitterPickupsiteCity: outgoingWaste.reportForPickupSiteCity,
    emitterPickupsiteCountry: outgoingWaste.reportForPickupSiteCountryCode,

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

    ecoOrganismeSiret: outgoingWaste.ecoOrganismeSiret,
    ecoOrganismeName: outgoingWaste.ecoOrganismeName,

    brokerCompanyName: outgoingWaste.brokerCompanyName,
    brokerCompanySiret: outgoingWaste.brokerCompanySiret,
    brokerRecepisseNumber: outgoingWaste.brokerRecepisseNumber,
    brokerCompanyMail: null,

    traderCompanyName: outgoingWaste.traderCompanyName,
    traderCompanySiret: outgoingWaste.traderCompanySiret,
    traderRecepisseNumber: outgoingWaste.traderRecepisseNumber,
    traderCompanyMail: null,

    isDirectSupply: outgoingWaste.isDirectSupply,

    transporter1CompanySiret: outgoingWaste.transporter1CompanyOrgId,
    transporter1CompanyName: outgoingWaste.transporter1CompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress: outgoingWaste.transporter1CompanyAddress,
    transporter1CompanyPostalCode: outgoingWaste.transporter1CompanyPostalCode,
    transporter1CompanyCity: outgoingWaste.transporter1CompanyCity,
    transporter1CompanyCountry: outgoingWaste.transporter1CompanyCountryCode,
    transporter1RecepisseIsExempted:
      outgoingWaste.transporter1RecepisseIsExempted,
    transporter1RecepisseNumber: outgoingWaste.transporter1RecepisseNumber,
    transporter1TransportMode: outgoingWaste.transporter1TransportMode,
    transporter1CompanyMail: null,

    transporter2CompanySiret: outgoingWaste.transporter2CompanyOrgId,
    transporter2CompanyName: outgoingWaste.transporter2CompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress: outgoingWaste.transporter2CompanyAddress,
    transporter2CompanyPostalCode: outgoingWaste.transporter2CompanyPostalCode,
    transporter2CompanyCity: outgoingWaste.transporter2CompanyCity,
    transporter2CompanyCountry: outgoingWaste.transporter2CompanyCountryCode,
    transporter2RecepisseIsExempted:
      outgoingWaste.transporter2RecepisseIsExempted,
    transporter2RecepisseNumber: outgoingWaste.transporter2RecepisseNumber,
    transporter2TransportMode: outgoingWaste.transporter2TransportMode,
    transporter2CompanyMail: null,

    transporter3CompanySiret: outgoingWaste.transporter3CompanyOrgId,
    transporter3CompanyName: outgoingWaste.transporter3CompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress: outgoingWaste.transporter3CompanyAddress,
    transporter3CompanyPostalCode: outgoingWaste.transporter3CompanyPostalCode,
    transporter3CompanyCity: outgoingWaste.transporter3CompanyCity,
    transporter3CompanyCountry: outgoingWaste.transporter3CompanyCountryCode,
    transporter3RecepisseIsExempted:
      outgoingWaste.transporter3RecepisseIsExempted,
    transporter3RecepisseNumber: outgoingWaste.transporter3RecepisseNumber,
    transporter3TransportMode: outgoingWaste.transporter3TransportMode,
    transporter3CompanyMail: null,

    transporter4CompanySiret: outgoingWaste.transporter4CompanyOrgId,
    transporter4CompanyName: outgoingWaste.transporter4CompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress: outgoingWaste.transporter4CompanyAddress,
    transporter4CompanyPostalCode: outgoingWaste.transporter4CompanyPostalCode,
    transporter4CompanyCity: outgoingWaste.transporter4CompanyCity,
    transporter4CompanyCountry: outgoingWaste.transporter4CompanyCountryCode,
    transporter4RecepisseIsExempted:
      outgoingWaste.transporter4RecepisseIsExempted,
    transporter4RecepisseNumber: outgoingWaste.transporter4RecepisseNumber,
    transporter4TransportMode: outgoingWaste.transporter4TransportMode,
    transporter4CompanyMail: null,

    transporter5CompanySiret: outgoingWaste.transporter5CompanyOrgId,
    transporter5CompanyName: outgoingWaste.transporter5CompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress: outgoingWaste.transporter5CompanyAddress,
    transporter5CompanyPostalCode: outgoingWaste.transporter5CompanyPostalCode,
    transporter5CompanyCity: outgoingWaste.transporter5CompanyCity,
    transporter5CompanyCountry: outgoingWaste.transporter5CompanyCountryCode,
    transporter5RecepisseIsExempted:
      outgoingWaste.transporter5RecepisseIsExempted,
    transporter5RecepisseNumber: outgoingWaste.transporter5RecepisseNumber,
    transporter5TransportMode: outgoingWaste.transporter5TransportMode,
    transporter5CompanyMail: null,

    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,

    destinationCompanySiret: outgoingWaste.destinationCompanyOrgId,
    destinationCompanyName: outgoingWaste.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress: outgoingWaste.destinationCompanyAddress,
    destinationCompanyPostalCode: outgoingWaste.destinationCompanyPostalCode,
    destinationCompanyCity: outgoingWaste.destinationCompanyCity,
    destinationCompanyCountry: outgoingWaste.destinationCompanyCountryCode,
    destinationCompanyMail: null,

    destinationDropSiteAddress: outgoingWaste.destinationDropSiteAddress,
    destinationDropSitePostalCode: outgoingWaste.destinationDropSitePostalCode,
    destinationDropSiteCity: outgoingWaste.destinationDropSiteCity,
    destinationDropSiteCountryCode:
      outgoingWaste.destinationDropSiteCountryCode,

    postTempStorageDestinationSiret: null,
    postTempStorageDestinationName: null,
    postTempStorageDestinationAddress: null,
    postTempStorageDestinationPostalCode: null,
    postTempStorageDestinationCity: null,
    postTempStorageDestinationCountry: null,

    destinationReceptionAcceptationStatus: null,
    destinationReceptionWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionRefusedWeight: null,

    destinationPlannedOperationCode: outgoingWaste.operationCode,
    destinationPlannedOperationMode: outgoingWaste.operationMode,
    destinationOperationCodes: null,
    destinationOperationModes: null,
    nextDestinationPlannedOperationCodes: null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: null,

    destinationFinalOperationCompanySirets: null,
    destinationFinalOperationCodes: null,
    destinationFinalOperationWeights: null,

    declarationNumber: outgoingWaste.declarationNumber,
    notificationNumber: outgoingWaste.notificationNumber,
    movementNumber: outgoingWaste.movementNumber,
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
  dispatchDate: true
};

type MinimalRegistryForLookup = Prisma.RegistryOutgoingWasteGetPayload<{
  select: typeof minimalRegistryForLookupSelect;
}>;

const registryToLookupCreateInput = (
  registryOutgoingWaste: MinimalRegistryForLookup
): Prisma.RegistryLookupUncheckedCreateInput => {
  return {
    id: registryOutgoingWaste.id,
    readableId: registryOutgoingWaste.publicId,
    siret: registryOutgoingWaste.reportForCompanySiret,
    reportAsSiret: registryOutgoingWaste.reportAsCompanySiret,
    exportRegistryType: RegistryExportType.OUTGOING,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: registryOutgoingWaste.wasteIsDangerous
      ? RegistryExportWasteType.DD
      : RegistryExportWasteType.DND,
    wasteCode: registryOutgoingWaste.wasteCode,
    ...generateDateInfos(registryOutgoingWaste.dispatchDate),
    registryOutgoingWasteId: registryOutgoingWaste.id
  };
};

export const updateRegistryLookup = async (
  registryOutgoingWaste: MinimalRegistryForLookup,
  oldRegistryOutgoingWasteId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryOutgoingWasteId) {
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
          id: oldRegistryOutgoingWasteId,
          exportRegistryType: RegistryExportType.OUTGOING,
          siret: registryOutgoingWaste.reportForCompanySiret
        }
      },
      data: {
        // only those properties can change during an update
        // the id changes because a new RegistrySsd entry is created on each update
        id: registryOutgoingWaste.id,
        reportAsSiret: registryOutgoingWaste.reportAsCompanySiret,
        wasteType: registryOutgoingWaste.wasteIsDangerous
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: registryOutgoingWaste.wasteCode,
        ...generateDateInfos(registryOutgoingWaste.dispatchDate),
        registryOutgoingWasteId: registryOutgoingWaste.id
      },
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  } else {
    await tx.registryLookup.create({
      data: registryToLookupCreateInput(registryOutgoingWaste),
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
      registryOutgoingWasteId: { not: null }
    }
  });
  // reindex registrySSD
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.registryOutgoingWaste.findMany({
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
    const createArray = items.map(
      (registryOutgoingWaste: MinimalRegistryForLookup) =>
        registryToLookupCreateInput(registryOutgoingWaste)
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
