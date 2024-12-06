import { prisma } from "@td/prisma";
import { ParsedZodIncomingTexsItem } from "./validation/schema";

export async function saveIncomingTexsLine({
  line,
  importId
}: {
  line: ParsedZodIncomingTexsItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, id, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registryIncomingTexs.update({
          where: { id },
          data: { isActive: false }
        });
        await tx.registryIncomingTexs.create({
          data: { ...persistedData, importId }
        });
      });
      return;
    case "ANNULER":
      await prisma.registryIncomingTexs.update({
        where: { id },
        data: { isCancelled: true }
      });
      return;
    case "IGNORER":
      return;
    default:
      await prisma.registryIncomingTexs.create({
        data: { ...persistedData, importId }
      });
      return;
  }
}

export async function getIncomingTexsImportSiretsAssociations(
  importId: string
) {
  const importSirets = await prisma.registryIncomingTexs.findMany({
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
