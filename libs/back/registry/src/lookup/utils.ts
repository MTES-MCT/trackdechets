import { PrismaClient } from "@prisma/client";
import { prisma } from "@td/prisma";
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
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await (tx ?? prisma).registryLookup.deleteMany({
    where: {
      id: id
    }
  });
  return;
};
