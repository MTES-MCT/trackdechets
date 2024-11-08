import { prisma } from "@td/prisma";
import { ParsedZodSsdItem } from "./validation/schema";
import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistrySsd
} from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

export async function saveSsdLine({
  line,
  importId
}: {
  line: ParsedZodSsdItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, id, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registrySsd.update({
          where: { id },
          data: { isActive: false }
        });
        const registrySsd = await tx.registrySsd.create({
          data: { ...persistedData, importId }
        });
        await updateRegistryLookup(registrySsd, tx, id);
      });
      return;
    case "ANNULER":
      await prisma.$transaction(async tx => {
        await prisma.registrySsd.update({
          where: { id },
          data: { isCancelled: true }
        });
        if (id) {
          await deleteRegistryLookup(id, tx);
        }
      });

      return;
    case "IGNORER":
      return;
    default:
      await prisma.$transaction(async tx => {
        const registrySsd = await tx.registrySsd.create({
          data: { ...persistedData, importId }
        });
        await updateRegistryLookup(registrySsd, tx);
      });

      return;
  }
}

const deleteRegistryLookup = async (
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

const updateRegistryLookup = async (
  registrySsd: RegistrySsd,
  tx: Omit<PrismaClient, ITXClientDenyList>,
  oldRegistrySsdId?: string
): Promise<void> => {
  let registryLookup: Prisma.RegistryLookupGetPayload<{
    select: { reportAsSirets: true };
  }>;
  if (oldRegistrySsdId) {
    registryLookup = await tx.registryLookup.update({
      where: {
        // we use this compound id to target a specific registry type for a specific registry id
        // this is not strictly necessary on SSDs since they only appear in one export registry
        // but is necessary on other types of registries that appear for multiple actors.
        id_exportRegistryType: {
          id: oldRegistrySsdId,
          exportRegistryType: RegistryExportType.SSD
        }
      },
      data: {
        // only those properties can change during an update
        // the id changes because a new RegistrySsd entry is created on each update
        id: registrySsd.id,
        sirets: [registrySsd.reportForSiret],
        wasteCode: registrySsd.wasteCode,
        date: (registrySsd.useDate ?? registrySsd.dispatchDate) as Date,
        registrySsdId: registrySsd.id
      },
      select: {
        // lean selection to improve performances
        reportAsSirets: true
      }
    });
  } else {
    registryLookup = await tx.registryLookup.create({
      data: {
        id: registrySsd.id,
        readableId: registrySsd.publicId,
        sirets: [registrySsd.reportForSiret],
        exportRegistryType: RegistryExportType.SSD,
        declarationType: RegistryExportDeclarationType.REGISTRY,
        wasteType: RegistryExportWasteType.DND,
        wasteCode: registrySsd.wasteCode,
        date: (registrySsd.useDate ?? registrySsd.dispatchDate) as Date,
        registrySsdId: registrySsd.id
      },
      select: {
        // lean selection to improve performances
        reportAsSirets: true
      }
    });
  }
  // if the registry entry comes from a delegation, we need to update the reportAsSirets array.
  // We only push the delegator's siret if it's not in it yet.
  // this is done separately from the previous upsert because it's not possible
  // to push to an array and check unicity with prisma.
  if (
    registrySsd.reportAsSiret &&
    registrySsd.reportAsSiret !== registrySsd.reportForSiret &&
    !registryLookup.reportAsSirets.some(
      siret => siret === registrySsd.reportAsSiret
    )
  ) {
    await tx.registryLookup.update({
      where: {
        id_exportRegistryType: {
          id: registrySsd.id,
          exportRegistryType: RegistryExportType.SSD
        }
      },
      data: {
        reportAsSirets: [
          ...registryLookup.reportAsSirets,
          registrySsd.reportAsSiret
        ]
      }
    });
  }
};

export async function getSsdImportSiretsAssociations(importId: string) {
  const importSirets = await prisma.registrySsd.findMany({
    distinct: ["reportForSiret"],
    where: { importId },
    select: { reportForSiret: true, reportAsSiret: true }
  });

  const siretsMap = importSirets.reduce(
    (list, { reportForSiret, reportAsSiret }) => {
      const as = reportAsSiret ?? reportForSiret;
      const key = `${reportForSiret}-${as}`;

      if (!list.has(key)) {
        list.set(key, { for: reportForSiret, as });
      }

      return list;
    },
    new Map<string, { for: string; as: string }>()
  );

  return [...siretsMap.values()];
}
