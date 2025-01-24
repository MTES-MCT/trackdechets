import { prisma } from "@td/prisma";
import { ParsedZodOutgoingWasteItem } from "./validation/schema";

export async function saveOutgoingWasteLine({
  line,
  importId
}: {
  line: ParsedZodOutgoingWasteItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, id, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registryOutgoingWaste.update({
          where: { id },
          data: { isLatest: false }
        });
        await tx.registryOutgoingWaste.create({
          data: { ...persistedData, importId }
        });
      });
      return;
    case "ANNULER":
      await prisma.registryOutgoingWaste.update({
        where: { id },
        data: { isCancelled: true }
      });
      return;
    case "IGNORER":
      return;
    default:
      await prisma.registryOutgoingWaste.create({
        data: { ...persistedData, importId }
      });
      return;
  }
}

export async function getOutgoingWasteImportSiretsAssociations(
  importId: string
) {
  const importSirets = await prisma.registryOutgoingWaste.findMany({
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
