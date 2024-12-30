import { Prisma, PrismaClient, RegistryExportType } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

export const generateDateInfos = (date: Date) => ({
  date,
  // generate a uuid v7 id
  // using the date as timestamp, so we can sort by this dateId
  // and be in date order with uniqueness
  dateId: uuidv7({
    msecs: date.getTime()
  })
});

export const updateRegistryDelegateSirets = async (
  registryType: RegistryExportType,
  registry: {
    id: string;
    reportForCompanySiret: string;
    reportAsCompanySiret?: string | null;
  },
  registryLookup: Prisma.RegistryLookupGetPayload<{
    select: { reportAsSirets: true };
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
    !registryLookup.reportAsSirets.includes(registry.reportAsCompanySiret)
  ) {
    await tx.registryLookup.updateMany({
      where: {
        id: registry.id,
        exportRegistryType: registryType
      },
      data: {
        reportAsSirets: [
          ...registryLookup.reportAsSirets,
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
