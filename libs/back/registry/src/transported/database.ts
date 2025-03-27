import { prisma } from "@td/prisma";
import { ParsedZodTransportedItem } from "./validation/schema";
import { lookupUtils } from "./registry";

export async function saveTransportedLine({
  line,
  importId
}: {
  line: ParsedZodTransportedItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, id, createdById, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registryTransported.update({
          where: { id },
          data: { isLatest: false }
        });
        const registryTransported = await tx.registryTransported.create({
          data: {
            ...persistedData,
            createdBy: { connect: { id: createdById } },
            importId
          }
        });
        await lookupUtils.update(registryTransported, id ?? null, tx);
      });
      return;
    case "ANNULER":
      await prisma.$transaction(async tx => {
        await tx.registryTransported.update({
          where: { id },
          data: { isCancelled: true }
        });
        if (id) {
          await lookupUtils.delete(id, tx);
        }
      });

      return;
    case "IGNORER":
      return;
    default:
      await prisma.$transaction(async tx => {
        const registryTransported = await tx.registryTransported.create({
          data: {
            ...persistedData,
            createdBy: { connect: { id: createdById } },
            importId
          }
        });
        await lookupUtils.update(registryTransported, null, tx);
      });

      return;
  }
}

export async function getTransportedImportSiretsAssociations(importId: string) {
  const importSirets = await prisma.registryTransported.findMany({
    distinct: ["reportForCompanySiret"],
    where: { importId },
    select: { reportForCompanySiret: true, reportAsCompanySiret: true }
  });

  const siretsMap = importSirets.reduce(
    (list, { reportForCompanySiret, reportAsCompanySiret }) => {
      const as = reportAsCompanySiret ?? reportForCompanySiret;
      const key = `${reportForCompanySiret}-${as}`;

      if (!list.has(key)) {
        list.set(key, { for: reportForCompanySiret, as });
      }

      return list;
    },
    new Map<string, { for: string; as: string }>()
  );

  return [...siretsMap.values()];
}
