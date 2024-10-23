import { prisma } from "@td/prisma";

type ImportStats = {
  errors: number;
  insertions: number;
  edits: number;
  cancellations: number;
};

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
  stats: ImportStats;
  sirets: { for: string; as: string }[];
}) {
  const status = getStatus(stats);

  const importResult = await prisma.registryImport.update({
    where: { id: importId },
    data: {
      status,
      numberOfCancellations: stats.cancellations,
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

function getStatus(stats: ImportStats) {
  if (stats.cancellations + stats.edits + stats.insertions === 0) {
    // No data was processed. Mark the import as failed
    return "FAILED";
  }

  if (stats.errors > 0) {
    return "PARTIALLY_SUCCESSFUL";
  }

  return "SUCCESSFUL";
}
