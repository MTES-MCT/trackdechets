import { prisma } from "@td/prisma";
import { ParsedZodSsdItem } from "./validation/schema";

export async function saveSsdLine({
  line,
  importId
}: {
  line: ParsedZodSsdItem & { createdById: string };
  importId: string;
}) {
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registrySsd.updateMany({
          where: { publicId: line.publicId },
          data: { isActive: false }
        });
        await tx.registrySsd.create({ data: { ...line, importId } });
      });
      return;
    case "ANNULER":
      await prisma.registrySsd.updateMany({
        where: { publicId: line.publicId },
        data: { isCancelled: true }
      });
      return;
    default:
      await prisma.registrySsd.create({ data: { ...line, importId } });
      return;
  }
}

export async function getSsdImportSirets(importId: string) {
  const importSirets = await prisma.registrySsd.findMany({
    distinct: ["reportForSiret"],
    where: { importId },
    select: { reportForSiret: true, reportAsSiret: true }
  });

  const siretsMap = importSirets.reduce(
    (list, { reportForSiret, reportAsSiret }) => {
      if (!list.has(reportForSiret)) {
        list.set(reportForSiret, { for: reportForSiret, as: reportAsSiret });
      }

      return list;
    },
    new Map<string, { for: string; as: string | null }>()
  );

  return [...siretsMap.values()];
}
