import { prisma } from "@td/prisma";
import type { RegistryChanges } from "./changeAggregates";

export async function startImport(importId: string) {
  const registryImport = await prisma.registryImport.update({
    where: { id: importId },
    data: { status: "STARTED" }
  });

  return registryImport;
}

export async function endImport({
  importId,
  stats,
  sirets
}: {
  importId: string;
  sirets: { for: string; as: string }[];
  stats: RegistryChanges;
}) {
  const status = getStatus(stats);

  const importResult = await prisma.registryImport.update({
    where: { id: importId },
    data: {
      status,
      numberOfCancellations: stats.cancellations,
      numberOfSkipped: stats.skipped,
      numberOfEdits: stats.edits,
      numberOfErrors: stats.errors,
      numberOfInsertions: stats.insertions,
      associations: {
        createMany: {
          data: sirets.map(siret => ({
            reportedFor: siret.for,
            reportedAs: siret.as
          }))
        }
      }
    }
  });

  return importResult;
}

export function updateImportStats({
  importId,
  stats
}: {
  importId: string;
  stats: RegistryChanges;
}) {
  return prisma.registryImport.update({
    where: { id: importId },
    data: {
      numberOfCancellations: stats.cancellations,
      numberOfSkipped: stats.skipped,
      numberOfEdits: stats.edits,
      numberOfErrors: stats.errors,
      numberOfInsertions: stats.insertions
    }
  });
}

function getStatus(stats: RegistryChanges) {
  if (
    stats.cancellations + stats.edits + stats.insertions + stats.skipped ===
    0
  ) {
    // No data was processed. Mark the import as failed
    return "FAILED";
  }

  if (stats.errors > 0) {
    return "PARTIALLY_SUCCESSFUL";
  }

  return "SUCCESSFUL";
}
