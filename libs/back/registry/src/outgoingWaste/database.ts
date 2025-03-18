import { prisma } from "@td/prisma";
import { ParsedZodOutgoingWasteItem } from "./validation/schema";
import { lookupUtils } from "./registry";

export async function saveOutgoingWasteLine({
  line,
  importId
}: {
  line: ParsedZodOutgoingWasteItem & { createdById: string };
  importId: string | null;
}) {
  const { reason, id, createdById, ...persistedData } = line;
  switch (line.reason) {
    case "MODIFIER":
      await prisma.$transaction(async tx => {
        await tx.registryOutgoingWaste.update({
          where: { id },
          data: { isLatest: false }
        });
        const registryOutgoingWaste = await tx.registryOutgoingWaste.create({
          data: {
            ...persistedData,
            createdBy: { connect: { id: createdById } },
            importId
          }
        });
        await lookupUtils.update(registryOutgoingWaste, id ?? null, tx);
      });
      return;
    case "ANNULER":
      await prisma.$transaction(async tx => {
        await tx.registryOutgoingWaste.update({
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
        const registryOutgoingWaste = await tx.registryOutgoingWaste.create({
          data: {
            ...persistedData,
            createdBy: { connect: { id: createdById } },
            importId
          }
        });
        await lookupUtils.update(registryOutgoingWaste, null, tx);
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
