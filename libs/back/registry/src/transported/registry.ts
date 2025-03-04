import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryTransported
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { deleteRegistryLookup, generateDateInfos } from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { TransportedWasteV2 } from "@td/codegen-back";

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
    wasteIsDangerous: transportedWaste.wasteIsDangerous,
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

    declarationNumber: transportedWaste.declarationNumber,
    movementNumber: transportedWaste.movementNumber,
    notificationNumber: transportedWaste.notificationNumber
  };
};

const minimalRegistryForLookupSelect = {
  id: true,
  publicId: true,
  reportForCompanySiret: true,
  reportAsCompanySiret: true,
  wasteIsDangerous: true,
  wasteCode: true,
  collectionDate: true
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
    wasteType: registryTransported.wasteIsDangerous
      ? RegistryExportWasteType.DD
      : RegistryExportWasteType.DND,
    wasteCode: registryTransported.wasteCode,
    ...generateDateInfos(registryTransported.collectionDate),
    registryTransportedId: registryTransported.id
  };
};

export const updateRegistryLookup = async (
  registryTransported: MinimalRegistryForLookup,
  oldRegistryTransportedId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryTransportedId) {
    await tx.registryLookup.update({
      where: {
        idExportTypeAndSiret: {
          id: oldRegistryTransportedId,
          exportRegistryType: RegistryExportType.TRANSPORTED,
          siret: registryTransported.reportForCompanySiret
        }
      },
      data: {
        id: registryTransported.id,
        reportAsSiret: registryTransported.reportAsCompanySiret,
        wasteType: registryTransported.wasteIsDangerous
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: registryTransported.wasteCode,
        ...generateDateInfos(registryTransported.collectionDate),
        registryTransportedId: registryTransported.id
      },
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

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      registryTransportedId: { not: null }
    }
  });
  // reindex registrySSD
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.registryTransported.findMany({
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
      (registryTransported: MinimalRegistryForLookup) =>
        registryToLookupCreateInput(registryTransported)
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
