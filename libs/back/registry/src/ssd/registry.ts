import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistrySsd
} from "@td/prisma";
import type { SsdWasteV2 } from "@td/codegen-back";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { prisma } from "@td/prisma";
import {
  checkRegistryLookupExistsForDiscovery,
  deleteRegistryLookup,
  generateDateInfos,
  type MissingLookupEntry,
  rebuildRegistryLookupGeneric
} from "../lookup/utils";

export const toSsdWaste = (ssd: RegistrySsd): SsdWasteV2 => {
  return {
    id: ssd.id,
    source: "REGISTRY",
    publicId: ssd.publicId,
    reportForSiret: ssd.reportForCompanySiret,
    reportForName: ssd.reportForCompanyName,
    reportAsSiret: ssd.reportAsCompanySiret,
    useDate: ssd.useDate,
    dispatchDate: ssd.dispatchDate,
    wasteCode: ssd.wasteCode,
    wasteDescription: ssd.wasteDescription,
    wasteCodeBale: ssd.wasteCodeBale,
    secondaryWasteCodes: ssd.secondaryWasteCodes,
    secondaryWasteDescriptions: ssd.secondaryWasteDescriptions,
    product: ssd.product,
    weightValue: ssd.weightValue,
    weightIsEstimate: ssd.weightIsEstimate,
    volume: ssd.volume,
    processingDate: ssd.processingDate,
    processingEndDate: ssd.processingEndDate,
    destinationType: ssd.destinationCompanyType,
    destinationOrgId: ssd.destinationCompanyOrgId,
    destinationName: ssd.destinationCompanyName,
    destinationAddress: ssd.destinationCompanyAddress,
    destinationPostalCode: ssd.destinationCompanyPostalCode,
    destinationCity: ssd.destinationCompanyCity,
    destinationCountryCode: ssd.destinationCompanyCountryCode,
    operationCode: ssd.operationCode,
    operationMode: ssd.operationMode,
    administrativeActReference: ssd.administrativeActReference
  };
};

const minimalRegistryForLookupSelect = {
  id: true,
  publicId: true,
  reportForCompanySiret: true,
  reportAsCompanySiret: true,
  wasteCode: true,
  useDate: true,
  dispatchDate: true,
  createdAt: true
};

type MinimalRegistryForLookup = Prisma.RegistrySsdGetPayload<{
  select: typeof minimalRegistryForLookupSelect;
}>;

const registryToLookupCreateInput = (
  registrySsd: MinimalRegistryForLookup
): Prisma.RegistryLookupUncheckedCreateInput => {
  return {
    id: registrySsd.id,
    readableId: registrySsd.publicId,
    siret: registrySsd.reportForCompanySiret,
    reportAsSiret: registrySsd.reportAsCompanySiret,
    exportRegistryType: RegistryExportType.SSD,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: RegistryExportWasteType.DND,
    wasteCode: registrySsd.wasteCode,
    ...generateDateInfos(
      (registrySsd.useDate ?? registrySsd.dispatchDate) as Date,
      registrySsd.createdAt
    ),
    registrySsdId: registrySsd.id
  };
};

export const updateRegistryLookup = async (
  registrySsd: MinimalRegistryForLookup,
  oldRegistrySsdId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (oldRegistrySsdId) {
    await tx.registryLookup.upsert({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // and a specific siret
        idExportTypeAndSiret: {
          id: oldRegistrySsdId,
          exportRegistryType: RegistryExportType.SSD,
          siret: registrySsd.reportForCompanySiret
        }
      },
      update: {
        // only those properties can change during an update
        // the id changes because a new RegistrySsd entry is created on each update
        id: registrySsd.id,
        reportAsSiret: registrySsd.reportAsCompanySiret,
        wasteCode: registrySsd.wasteCode,
        ...generateDateInfos(
          (registrySsd.useDate ?? registrySsd.dispatchDate) as Date,
          registrySsd.createdAt
        ),
        registrySsdId: registrySsd.id
      },
      create: registryToLookupCreateInput(registrySsd),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  } else {
    await tx.registryLookup.create({
      data: registryToLookupCreateInput(registrySsd),
      select: {
        // lean selection to improve performances
        id: true
      }
    });
  }
};

const ssdBaseWhere = {
  isCancelled: false,
  isLatest: true
};

export const discoverMissingLookups = async (
  items: MinimalRegistryForLookup[]
): Promise<MissingLookupEntry[]> => {
  const missing: MissingLookupEntry[] = [];
  for (const item of items) {
    const exists = await checkRegistryLookupExistsForDiscovery({
      id: item.id,
      exportRegistryType: RegistryExportType.SSD,
      siret: item.reportForCompanySiret
    });
    if (!exists) {
      missing.push({
        id: item.id,
        publicId: item.publicId,
        siret: item.reportForCompanySiret,
        createdAt: item.createdAt.toISOString()
      });
    }
  }
  return missing;
};

export const rebuildRegistryLookup =
  rebuildRegistryLookupGeneric<MinimalRegistryForLookup>({
    name: "SSD",
    getTotalCount: (ids?: string[]) =>
      prisma.registrySsd.count({
        where: {
          ...ssdBaseWhere,
          ...(ids?.length ? { id: { in: ids } } : {})
        }
      }),
    findMany: (pageSize, cursorId, ids?: string[]) =>
      prisma.registrySsd.findMany({
        where: {
          ...ssdBaseWhere,
          ...(ids?.length ? { id: { in: ids } } : {})
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
      items.map((registrySsd: MinimalRegistryForLookup) =>
        registryToLookupCreateInput(registrySsd)
      ),
    discoverMissingLookups
  });

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
