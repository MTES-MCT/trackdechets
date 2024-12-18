import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistrySsd
} from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { prisma } from "@td/prisma";

const generateDateInfos = (date: Date) => ({
  date,
  // generate a uuid v7 id
  // using the date as timestamp, so we can sort by this dateId
  // and be in date order with uniqueness
  dateId: uuidv7({
    msecs: date.getTime()
  })
});

const updateRegistryDelegateSirets = async (
  registryType: RegistryExportType,
  registry: {
    id: string;
    reportForCompanySiret: string;
    reportAsCompanySiret?: string | null;
  },
  registryLookup: Prisma.RegistryLookupGetPayload<{
    select: { reportAsCompanySirets: true };
  }>,
  tx: Omit<PrismaClient, ITXClientDenyList>
) => {
  // if the registry entry comes from a delegation, we need to update the reportAsCompanySirets array.
  // We only push the delegator's siret if it's not in it yet.
  // this is done separately from the previous upsert because it's not possible
  // to push to an array and check unicity with prisma.

  // For cases where the siret can change during the update :
  // the new registryLookup doesn't contain anything in reportAsCompanySirets
  // this still makes sense because a change of siret would also mean that previous delegates
  // don't necessarily apply to the new siret, so it makes sense to lose them.

  if (
    registry.reportAsCompanySiret &&
    registry.reportAsCompanySiret !== registry.reportForCompanySiret &&
    !registryLookup.reportAsCompanySirets.includes(registry.reportAsCompanySiret)
  ) {
    await tx.registryLookup.updateMany({
      where: {
        id: registry.id,
        exportRegistryType: registryType
      },
      data: {
        reportAsCompanySirets: [
          ...registryLookup.reportAsCompanySirets,
          registry.reportAsCompanySiret
        ]
      }
    });
  }
};

// cleanup method for cases where the siret could change between updates

// const cleanupPreviousSirets = async (
//   oldRegistryId: string,
//   registryType: RegistryExportType,
//   siretsToKeep: string[],
//   tx: Omit<PrismaClient, ITXClientDenyList>
// ): Promise<void> => {
//   await tx.registryLookup.deleteMany({
//     where: {
//       id: oldRegistryId,
//       exportRegistryType: registryType,
//       siret: { notIn: siretsToKeep }
//     }
//   });
// };

export const updateRegistrySsdLookup = async (
  registrySsd: RegistrySsd,
  oldRegistrySsdId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  let registryLookup: Prisma.RegistryLookupGetPayload<{
    select: { reportAsCompanySirets: true };
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
        id_exportRegistryType_siret: {
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
        reportAsCompanySirets: true
      }
    });
  } else {
    registryLookup = await tx.registryLookup.create({
      data: {
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
      },
      select: {
        // lean selection to improve performances
        reportAsCompanySirets: true
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
export const deleteRegistryLookup = async (
  id: string,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await tx.registryLookup.deleteMany({
    where: {
      id: id
    }
  });
  return;
};

export const rebuildRegistrySsdLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      registrySsdId: { not: null }
    }
  });
  // reindex registrySSD
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.registrySsd.findMany({
      where: {
        isCancelled: false,
        isActive: true
      },
      take: 100,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      }
    });
    for (const registrySsd of items) {
      await prisma.$transaction(async tx => {
        await updateRegistrySsdLookup(registrySsd, null, tx);
      });
    }
    if (items.length < 100) {
      done = true;
      return;
    }
    cursorId = items[items.length - 1].id;
  }
};

export default {
  RegistrySsd: {
    update: updateRegistrySsdLookup,
    delete: deleteRegistryLookup,
    rebuildLookup: rebuildRegistrySsdLookup
  }
};
