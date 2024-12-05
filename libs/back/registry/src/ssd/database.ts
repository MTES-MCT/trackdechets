import { prisma } from "@td/prisma";
import { ParsedZodSsdItem } from "./validation/schema";
import LookupUtils from "../lookup/utils";

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
        await LookupUtils.RegistrySsd.update(registrySsd, id ?? null, tx);
      });
      return;
    case "ANNULER":
      await prisma.$transaction(async tx => {
        await prisma.registrySsd.update({
          where: { id },
          data: { isCancelled: true }
        });
        if (id) {
          await LookupUtils.RegistrySsd.delete(id, tx);
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
        await LookupUtils.RegistrySsd.update(registrySsd, null, tx);
      });

      return;
  }
}

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
