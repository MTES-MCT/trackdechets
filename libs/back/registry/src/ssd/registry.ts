import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistrySsd
} from "@prisma/client";
import type { SsdWasteV2 } from "@td/codegen-back";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { prisma } from "@td/prisma";
import {
  deleteRegistryLookup,
  generateDateInfos,
  updateRegistryDelegateSirets
} from "../lookup/utils";
import { performance } from "perf_hooks";

export const toSsdWaste = (ssd: RegistrySsd): SsdWasteV2 => {
  return {
    id: ssd.id,
    source: "REGISTRY",
    publicId: ssd.publicId,
    reportForSiret: ssd.reportForCompanySiret,
    reportForName: ssd.reportForCompanyName,
    reportForAddress: ssd.reportForCompanyAddress,
    reportForCity: ssd.reportForCompanyCity,
    reportForPostalCode: ssd.reportForCompanyPostalCode,
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
  dispatchDate: true
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
    exportRegistryType: RegistryExportType.SSD,
    declarationType: RegistryExportDeclarationType.REGISTRY,
    wasteType: RegistryExportWasteType.DND,
    wasteCode: registrySsd.wasteCode,
    ...generateDateInfos(
      (registrySsd.useDate ?? registrySsd.dispatchDate) as Date
    ),
    registrySsdId: registrySsd.id
  };
};

export const updateRegistryLookup = async (
  registrySsd: MinimalRegistryForLookup,
  oldRegistrySsdId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  let registryLookup: Prisma.RegistryLookupGetPayload<{
    select: { reportAsSirets: true };
  }>;
  if (oldRegistrySsdId) {
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
        idExportTypeAndSiret: {
          id: oldRegistrySsdId,
          exportRegistryType: RegistryExportType.SSD,
          siret: registrySsd.reportForCompanySiret
        }
      },
      data: {
        // only those properties can change during an update
        // the id changes because a new RegistrySsd entry is created on each update
        id: registrySsd.id,
        wasteCode: registrySsd.wasteCode,
        ...generateDateInfos(
          (registrySsd.useDate ?? registrySsd.dispatchDate) as Date
        ),
        registrySsdId: registrySsd.id
      },
      select: {
        // lean selection to improve performances
        reportAsSirets: true
      }
    });
  } else {
    registryLookup = await tx.registryLookup.create({
      data: registryToLookupCreateInput(registrySsd),
      select: {
        // lean selection to improve performances
        reportAsSirets: true
      }
    });
  }

  await updateRegistryDelegateSirets(
    RegistryExportType.SSD,
    registrySsd,
    registryLookup,
    tx
  );
};

export const rebuildRegistryLookup = async () => {
  const deleteStart = performance.now();
  await prisma.registryLookup.deleteMany({
    where: {
      registrySsdId: { not: null }
    }
  });
  const deleteEnd = performance.now();
  console.log(`global delete: ${deleteEnd - deleteStart}ms`);

  // reindex registrySSD
  let done = false;
  let cursorId: string | null = null;
  let accuFetch = 0;
  let accuUpdate = 0;
  let iters = 0;
  while (!done) {
    const fetchStart = performance.now();
    const items = await prisma.registrySsd.findMany({
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
    const fetchEnd = performance.now();

    const updateStart = performance.now();
    const createArray = items.map((registrySsd: RegistrySsd) => {
      const res = registryToLookupCreateInput(registrySsd);
      if (
        registrySsd.reportAsCompanySiret &&
        registrySsd.reportAsCompanySiret !== registrySsd.reportForCompanySiret
      ) {
        res.reportAsSirets = [registrySsd.reportAsCompanySiret];
      }
      return res;
    });
    await prisma.registryLookup.createMany({
      data: createArray
    });

    const updateEnd = performance.now();
    if (items.length < 100) {
      done = true;
      break;
    }
    cursorId = items[items.length - 1].id;
    accuFetch += fetchEnd - fetchStart;
    accuUpdate += updateEnd - updateStart;
    iters += 1;
  }

  if (iters > 0) {
    const meanFetch = accuFetch / iters;
    const meanUpdate = accuUpdate / iters;
    console.log(`mean fetch (100 rows): ${meanFetch}ms`);
    console.log(`mean update (100 rows): ${meanUpdate}ms`);
  }
};

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
