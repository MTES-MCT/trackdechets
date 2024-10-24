import { prisma } from "@td/prisma";
import { ParsedZodSsdItem } from "./validation/schema";

export async function saveSsdLine({
  line,
  importId
}: {
  line: ParsedZodSsdItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registrySsd.updateMany({
          where: { publicId: line.publicId },
          data: { isActive: false }
        });
        await tx.registrySsd.create({ data: { ...persistedData, importId } });
      });
      return;
    case "ANNULER":
      await prisma.registrySsd.updateMany({
        where: { publicId: line.publicId },
        data: { isCancelled: true }
      });
      return;
    case "IGNORER":
      return;
    default:
      await prisma.registrySsd.create({ data: { ...persistedData, importId } });
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
