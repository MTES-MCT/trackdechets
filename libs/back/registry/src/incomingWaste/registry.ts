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
  deleteRegistryLookup,
  generateDateInfos,
  updateRegistryDelegateSirets
} from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { IncomingWasteV2 } from "@td/codegen-back";

export const toIncomingWaste = (
  incomingWaste: RegistryIncomingWaste
): IncomingWasteV2 => {
  return {
    id: incomingWaste.id,
    source: "REGISTRY",
    publicId: incomingWaste.publicId,
    bsdId: null,
    reportAsSiret: incomingWaste.reportAsCompanySiret,
    createdAt: incomingWaste.createdAt,
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
    wasteIsDangerous: incomingWaste.wasteIsDangerous,
    weight: null,
    initialEmitterCompanyName: incomingWaste.initialEmitterCompanyName,
    initialEmitterCompanySiret: incomingWaste.initialEmitterCompanyOrgId,
    initialEmitterCompanyAddress: incomingWaste.initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode:
      incomingWaste.initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity: incomingWaste.initialEmitterCompanyCity,
    initialEmitterCompanyCountry:
      incomingWaste.initialEmitterCompanyCountryCode,
    initialEmitterMunicipalitiesNames:
      incomingWaste.initialEmitterMunicipalitiesNames,
    initialEmitterMunicipalitiesInseeCodes:
      incomingWaste.initialEmitterMunicipalitiesInseeCodes,
    emitterCompanyIrregularSituation: null,
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
    destinationOperationMode: incomingWaste.operationMode,
    destinationOperationCode: incomingWaste.operationCode,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: incomingWaste.noTraceability,
    declarationNumber: incomingWaste.declarationNumber,
    movementNumber: incomingWaste.movementNumber,
    notificationNumber: incomingWaste.notificationNumber,
    nextOperationCode: incomingWaste.nextOperationCode,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

export const updateRegistryLookup = async (
  registryIncomingWaste: RegistryIncomingWaste,
  oldRegistryIncomingWasteId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  let registryLookup: Prisma.RegistryLookupGetPayload<{
    select: { reportAsSirets: true };
  }>;
  if (oldRegistryIncomingWasteId) {
    // note for future implementations:
    // if there is a possibility that the siret changes between updates (BSDs),
    // you should use an upsert.
    // This is because the index would point to an empty lookup in that case, so we need to create it.
    // the cleanup method will remove the lookup with the old siret afterward
    registryLookup = await tx.registryLookup.update({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // and a specific siret
        // this is not strictly necessary on SSDs since they only appear in one export registry, for one siret
        // but is necessary on other types of registries that appear for multiple actors/ export registries
        id_exportRegistryType_siret: {
          id: oldRegistryIncomingWasteId,
          exportRegistryType: RegistryExportType.INCOMING,
          siret: registryIncomingWaste.reportForCompanySiret
        }
      },
      data: {
        // only those properties can change during an update
        // the id changes because a new RegistrySsd entry is created on each update
        id: registryIncomingWaste.id,
        wasteCode: registryIncomingWaste.wasteCode,
        ...generateDateInfos(registryIncomingWaste.receptionDate),
        registryIncomingWasteId: registryIncomingWaste.id
      },
      select: {
        // lean selection to improve performances
        reportAsSirets: true
      }
    });
  } else {
    registryLookup = await tx.registryLookup.create({
      data: {
        id: registryIncomingWaste.id,
        readableId: registryIncomingWaste.publicId,
        siret: registryIncomingWaste.reportForCompanySiret,
        exportRegistryType: RegistryExportType.INCOMING,
        declarationType: RegistryExportDeclarationType.REGISTRY,
        wasteType: registryIncomingWaste.wasteIsDangerous
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: registryIncomingWaste.wasteCode,
        ...generateDateInfos(registryIncomingWaste.receptionDate),
        registryIncomingWasteId: registryIncomingWaste.id
      },
      select: {
        // lean selection to improve performances
        reportAsSirets: true
      }
    });
  }

  await updateRegistryDelegateSirets(
    RegistryExportType.INCOMING,
    registryIncomingWaste,
    registryLookup,
    tx
  );
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      registryIncomingWasteId: { not: null }
    }
  });
  // reindex registrySSD
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.registryIncomingWaste.findMany({
      where: {
        isCancelled: false,
        isLatest: true
      },
      take: 100,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      }
    });
    for (const registryIncomingWaste of items) {
      await prisma.$transaction(async tx => {
        await updateRegistryLookup(registryIncomingWaste, null, tx);
      });
    }
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
