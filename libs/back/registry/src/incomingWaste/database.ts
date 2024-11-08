import { prisma } from "@td/prisma";
import { ParsedZodIncomingWasteItem } from "./validation/schema";

export async function saveIncomingWasteLine({
  line,
  importId
}: {
  line: ParsedZodIncomingWasteItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, id, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registryIncomingWaste.update({
          where: { id },
          data: { isActive: false }
        });
        await tx.registryIncomingWaste.create({
          data: { ...persistedData, importId }
        });
      });
      return;
    case "ANNULER":
      await prisma.registryIncomingWaste.update({
        where: { id },
        data: { isCancelled: true }
      });
      return;
    case "IGNORER":
      return;
    default:
      await prisma.registryIncomingWaste.create({
        data: { ...persistedData, importId }
      });
      return;
  }
}

export async function getIncomingWasteImportSiretsAssociations(
  importId: string
) {
  const importSirets = await prisma.registryIncomingWaste.findMany({
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
