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

const generateDateInfos = (date: Date) => ({
  date,
  // generate a uuid v7 id
  // using the date as timestamp, so we can sort by this dateId
  // and be in date order with uniqueness
  dateId: uuidv7({
    msecs: date.getTime()
  })
});

const updateRegistrySirets = async (
  registryType: RegistryExportType,
  registry: {
    id: string;
    reportForSiret: string;
    reportAsSiret?: string | null;
  },
  registryLookup: Prisma.RegistryLookupGetPayload<{
    select: { reportAsSirets: true };
  }>,
  tx: Omit<PrismaClient, ITXClientDenyList>
) => {
  // if the registry entry comes from a delegation, we need to update the reportAsSirets array.
  // We only push the delegator's siret if it's not in it yet.
  // this is done separately from the previous upsert because it's not possible
  // to push to an array and check unicity with prisma.
  if (
    registry.reportAsSiret &&
    registry.reportAsSiret !== registry.reportForSiret &&
    !registryLookup.reportAsSirets.includes(registry.reportAsSiret)
  ) {
    await tx.registryLookup.update({
      where: {
        id_exportRegistryType: {
          id: registry.id,
          exportRegistryType: registryType
        }
      },
      data: {
        reportAsSirets: [
          ...registryLookup.reportAsSirets,
          registry.reportAsSiret
        ]
      }
    });
  }
};

export const updateRegistrySsdLookup = async (
  registrySsd: RegistrySsd,
  oldRegistrySsdId: string | null,
  tx: Omit<PrismaClient, ITXClientDenyList>
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
      data: {
        id: registrySsd.id,
        readableId: registrySsd.publicId,
        sirets: [registrySsd.reportForSiret],
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
        reportAsSirets: true
      }
    });
  }
  await updateRegistrySirets(
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

export default {
  RegistrySsd: {
    update: updateRegistrySsdLookup,
    delete: deleteRegistryLookup
  }
};
