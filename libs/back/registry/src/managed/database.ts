import { prisma } from "@td/prisma";
import { ParsedZodManagedItem } from "./validation/schema";
import { lookupUtils } from "./registry";

export async function saveManagedLine({
  line,
  importId
}: {
  line: ParsedZodManagedItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, id, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registryManaged.update({
          where: { id },
          data: { isLatest: false }
        });
        const registryManaged = await tx.registryManaged.create({
          data: { ...persistedData, importId }
        });
        await lookupUtils.update(registryManaged, id ?? null, tx);
      });
      return;
    case "ANNULER":
      await prisma.$transaction(async tx => {
        await tx.registryManaged.update({
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
        const registryManaged = await tx.registryManaged.create({
          data: { ...persistedData, importId }
        });
        await lookupUtils.update(registryManaged, null, tx);
      });

      return;
  }
}

export async function getManagedImportSiretsAssociations(importId: string) {
  const importSirets = await prisma.registryManaged.findMany({
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
