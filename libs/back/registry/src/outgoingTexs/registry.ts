import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  deleteRegistryLookup,
  generateDateInfos,
  rebuildRegistryLookupGeneric
} from "../lookup/utils";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { OutgoingWasteV2 } from "@td/codegen-back";
import { isDangerous } from "@td/constants";

export const RegistryV2OutgoingTexsInclude =
  Prisma.validator<Prisma.RegistryOutgoingTexsInclude>()({
    texsAnalysisFiles: true
  });

export type RegistryV2OutgoingTexs = Prisma.RegistryOutgoingTexsGetPayload<{
  include: typeof RegistryV2OutgoingTexsInclude;
}>;

export const toOutgoingWaste = (
  outgoingTexs: RegistryV2OutgoingTexs
): OutgoingWasteV2 => {
  return {
    id: outgoingTexs.id,
    source: "REGISTRY",
    publicId: outgoingTexs.publicId,
    bsdId: null,
    reportAsSiret: outgoingTexs.reportAsCompanySiret,
    createdAt: null,
    updatedAt: null,
    transporterTakenOverAt: outgoingTexs.dispatchDate,
    destinationOperationDate: null,
    bsdType: null,
    bsdSubType: null,
    customId: null,
    status: null,
    wasteDescription: outgoingTexs.wasteDescription,
    wasteCode: outgoingTexs.wasteCode,
    wasteCodeBale: outgoingTexs.wasteCodeBale,
    wastePop: outgoingTexs.wastePop,
    wasteIsDangerous:
      !!outgoingTexs.wasteIsDangerous ||
      !!outgoingTexs.wastePop ||
      isDangerous(outgoingTexs.wasteCode),
    quantity: null,
    wasteContainsElectricOrHybridVehicles: null,
    weight: outgoingTexs.weightValue,
    weightIsEstimate: outgoingTexs.weightIsEstimate,
    volume: outgoingTexs.volume,

    initialEmitterCompanySiret: outgoingTexs.initialEmitterCompanyOrgId,
    initialEmitterCompanyName: outgoingTexs.initialEmitterCompanyName,
    initialEmitterCompanyAddress: outgoingTexs.initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode:
      outgoingTexs.initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity: outgoingTexs.initialEmitterCompanyCity,
    initialEmitterCompanyCountry: outgoingTexs.initialEmitterCompanyCountryCode,
    initialEmitterMunicipalitiesInseeCodes:
      outgoingTexs.initialEmitterMunicipalitiesInseeCodes,

    emitterCompanyIrregularSituation: null,
    emitterCompanyType: null,
    emitterCompanySiret: outgoingTexs.reportForCompanySiret,
    emitterCompanyName: outgoingTexs.reportForCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress: outgoingTexs.reportForCompanyAddress,
    emitterCompanyPostalCode: outgoingTexs.reportForCompanyPostalCode,
    emitterCompanyCity: outgoingTexs.reportForCompanyCity,
    emitterCompanyCountry: null,
    emitterCompanyMail: null,
    emitterPickupsiteName: outgoingTexs.reportForPickupSiteName,
    emitterPickupsiteAddress: outgoingTexs.reportForPickupSiteAddress,
    emitterPickupsitePostalCode: outgoingTexs.reportForPickupSitePostalCode,
    emitterPickupsiteCity: outgoingTexs.reportForPickupSiteCity,
    emitterPickupsiteCountry: outgoingTexs.reportForPickupSiteCountryCode,

    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: outgoingTexs.parcelInseeCodes,
    parcelNumbers: outgoingTexs.parcelNumbers,
    parcelCoordinates: outgoingTexs.parcelCoordinates,
    sisIdentifiers: outgoingTexs.sisIdentifier
      ? [outgoingTexs.sisIdentifier]
      : null,

    ecoOrganismeSiret: outgoingTexs.ecoOrganismeSiret,
    ecoOrganismeName: outgoingTexs.ecoOrganismeName,

    brokerCompanyName: outgoingTexs.brokerCompanyName,
    brokerCompanySiret: outgoingTexs.brokerCompanySiret,
    brokerRecepisseNumber: outgoingTexs.brokerRecepisseNumber,
    brokerCompanyMail: null,

    traderCompanyName: outgoingTexs.traderCompanyName,
    traderCompanySiret: outgoingTexs.traderCompanySiret,
    traderRecepisseNumber: outgoingTexs.traderRecepisseNumber,
    traderCompanyMail: null,

    isDirectSupply: outgoingTexs.isDirectSupply,

    transporter1CompanySiret: outgoingTexs.transporter1CompanyOrgId,
    transporter1CompanyName: outgoingTexs.transporter1CompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress: outgoingTexs.transporter1CompanyAddress,
    transporter1CompanyPostalCode: outgoingTexs.transporter1CompanyPostalCode,
    transporter1CompanyCity: outgoingTexs.transporter1CompanyCity,
    transporter1CompanyCountry: outgoingTexs.transporter1CompanyCountryCode,
    transporter1RecepisseIsExempted:
      outgoingTexs.transporter1RecepisseIsExempted,
    transporter1RecepisseNumber: outgoingTexs.transporter1RecepisseNumber,
    transporter1TransportMode: outgoingTexs.transporter1TransportMode,
    transporter1CompanyMail: null,

    transporter2CompanySiret: outgoingTexs.transporter2CompanyOrgId,
    transporter2CompanyName: outgoingTexs.transporter2CompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanyAddress: outgoingTexs.transporter2CompanyAddress,
    transporter2CompanyPostalCode: outgoingTexs.transporter2CompanyPostalCode,
    transporter2CompanyCity: outgoingTexs.transporter2CompanyCity,
    transporter2CompanyCountry: outgoingTexs.transporter2CompanyCountryCode,
    transporter2RecepisseIsExempted:
      outgoingTexs.transporter2RecepisseIsExempted,
    transporter2RecepisseNumber: outgoingTexs.transporter2RecepisseNumber,
    transporter2TransportMode: outgoingTexs.transporter2TransportMode,
    transporter2CompanyMail: null,

    transporter3CompanySiret: outgoingTexs.transporter3CompanyOrgId,
    transporter3CompanyName: outgoingTexs.transporter3CompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanyAddress: outgoingTexs.transporter3CompanyAddress,
    transporter3CompanyPostalCode: outgoingTexs.transporter3CompanyPostalCode,
    transporter3CompanyCity: outgoingTexs.transporter3CompanyCity,
    transporter3CompanyCountry: outgoingTexs.transporter3CompanyCountryCode,
    transporter3RecepisseIsExempted:
      outgoingTexs.transporter3RecepisseIsExempted,
    transporter3RecepisseNumber: outgoingTexs.transporter3RecepisseNumber,
    transporter3TransportMode: outgoingTexs.transporter3TransportMode,
    transporter3CompanyMail: null,

    transporter4CompanySiret: outgoingTexs.transporter4CompanyOrgId,
    transporter4CompanyName: outgoingTexs.transporter4CompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanyAddress: outgoingTexs.transporter4CompanyAddress,
    transporter4CompanyPostalCode: outgoingTexs.transporter4CompanyPostalCode,
    transporter4CompanyCity: outgoingTexs.transporter4CompanyCity,
    transporter4CompanyCountry: outgoingTexs.transporter4CompanyCountryCode,
    transporter4RecepisseIsExempted:
      outgoingTexs.transporter4RecepisseIsExempted,
    transporter4RecepisseNumber: outgoingTexs.transporter4RecepisseNumber,
    transporter4TransportMode: outgoingTexs.transporter4TransportMode,
    transporter4CompanyMail: null,

    transporter5CompanySiret: outgoingTexs.transporter5CompanyOrgId,
    transporter5CompanyName: outgoingTexs.transporter5CompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanyAddress: outgoingTexs.transporter5CompanyAddress,
    transporter5CompanyPostalCode: outgoingTexs.transporter5CompanyPostalCode,
    transporter5CompanyCity: outgoingTexs.transporter5CompanyCity,
    transporter5CompanyCountry: outgoingTexs.transporter5CompanyCountryCode,
    transporter5RecepisseIsExempted:
      outgoingTexs.transporter5RecepisseIsExempted,
    transporter5RecepisseNumber: outgoingTexs.transporter5RecepisseNumber,
    transporter5TransportMode: outgoingTexs.transporter5TransportMode,
    transporter5CompanyMail: null,

    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: outgoingTexs.wasteDap,
    texsAnalysisFiles: !!outgoingTexs.texsAnalysisFiles?.length,

    destinationCompanySiret: outgoingTexs.destinationCompanyOrgId,
    destinationCompanyName: outgoingTexs.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress: outgoingTexs.destinationCompanyAddress,
    destinationCompanyPostalCode: outgoingTexs.destinationCompanyPostalCode,
    destinationCompanyCity: outgoingTexs.destinationCompanyCity,
    destinationCompanyCountry: outgoingTexs.destinationCompanyCountryCode,
    destinationCompanyMail: null,

    destinationDropSiteAddress: outgoingTexs.destinationDropSiteAddress,
    destinationDropSitePostalCode: outgoingTexs.destinationDropSitePostalCode,
    destinationDropSiteCity: outgoingTexs.destinationDropSiteCity,
    destinationDropSiteCountryCode: outgoingTexs.destinationDropSiteCountryCode,

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

    destinationPlannedOperationCode: outgoingTexs.operationCode,
    destinationPlannedOperationMode: outgoingTexs.operationMode,
    destinationOperationCodes: null,
    destinationOperationModes: null,
    nextDestinationPlannedOperationCodes: null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: null,

    destinationFinalOperationCompanySirets: null,
    destinationFinalOperationCodes: null,
    destinationFinalOperationWeights: null,

    gistridNumber: outgoingTexs.gistridNumber,
    movementNumber: outgoingTexs.movementNumber,
    isUpcycled: outgoingTexs.isUpcycled,
    destinationParcelInseeCodes: outgoingTexs.destinationParcelInseeCodes,
    destinationParcelNumbers: outgoingTexs.destinationParcelNumbers,
    destinationParcelCoordinates: outgoingTexs.destinationParcelCoordinates
  };
};

const minimalRegistryForLookupSelect = {
  id: true,
  publicId: true,
  reportForCompanySiret: true,
  reportAsCompanySiret: true,
  wasteCode: true,
  dispatchDate: true,
  createdAt: true
};

type MinimalRegistryForLookup = Prisma.RegistryOutgoingTexsGetPayload<{
  select: typeof minimalRegistryForLookupSelect;
}>;

const registryToLookupCreateInput = (
  registryOutgoingTexs: MinimalRegistryForLookup
): Prisma.RegistryLookupUncheckedCreateInput => {
  return {
    id: registryOutgoingTexs.id,
    readableId: registryOutgoingTexs.publicId,
    siret: registryOutgoingTexs.reportForCompanySiret,
    reportAsSiret: registryOutgoingTexs.reportAsCompanySiret,
    exportRegistryType: RegistryExportType.OUTGOING,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: RegistryExportWasteType.TEXS,
    wasteCode: registryOutgoingTexs.wasteCode,
    ...generateDateInfos(
      registryOutgoingTexs.dispatchDate,
      registryOutgoingTexs.createdAt
    ),
    registryOutgoingTexsId: registryOutgoingTexs.id
  };
};

export const updateRegistryLookup = async (
  registryOutgoingTexs: MinimalRegistryForLookup,
  oldRegistryOutgoingTexsId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistryOutgoingTexsId) {
    await tx.registryLookup.upsert({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // and a specific siret
        idExportTypeAndSiret: {
          id: oldRegistryOutgoingTexsId,
          exportRegistryType: RegistryExportType.OUTGOING,
          siret: registryOutgoingTexs.reportForCompanySiret
        }
      },
      update: {
        // only those properties can change during an update
        // the id changes because a new Registry entry is created on each update
        id: registryOutgoingTexs.id,
        reportAsSiret: registryOutgoingTexs.reportAsCompanySiret,
        wasteCode: registryOutgoingTexs.wasteCode,
        ...generateDateInfos(
          registryOutgoingTexs.dispatchDate,
          registryOutgoingTexs.createdAt
        ),
        registryOutgoingTexsId: registryOutgoingTexs.id
      },
      create: registryToLookupCreateInput(registryOutgoingTexs),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  } else {
    await tx.registryLookup.create({
      data: registryToLookupCreateInput(registryOutgoingTexs),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  }
};

export const rebuildRegistryLookup =
  rebuildRegistryLookupGeneric<MinimalRegistryForLookup>({
    name: "OUTGOING_TEXS",
    getTotalCount: () =>
      prisma.registryOutgoingTexs.count({
        where: {
          isCancelled: false,
          isLatest: true
        }
      }),
    findMany: (pageSize, cursorId) =>
      prisma.registryOutgoingTexs.findMany({
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
      }),
    toLookupData: items =>
      items.map((registryOutgoingTexs: MinimalRegistryForLookup) =>
        registryToLookupCreateInput(registryOutgoingTexs)
      )
  });

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
