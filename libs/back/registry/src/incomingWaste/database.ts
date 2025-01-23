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
          data: { isLatest: false }
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
