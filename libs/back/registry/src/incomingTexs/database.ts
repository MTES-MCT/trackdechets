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
          data: { isLatest: false }
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
