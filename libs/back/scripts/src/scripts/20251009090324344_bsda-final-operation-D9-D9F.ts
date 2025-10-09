import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";

// TRA-16750: Migration des codes D9 vers D9F dans les BSDA & BSDASRI

// Estimated count in production: 0

// Fine-tune the batch size here
const BATCH_SIZE = 100;

const { REDIS_URL, NODE_ENV } = process.env;
const INDEX_QUEUE_NAME = `queue_index_elastic_${NODE_ENV}`;

const indexQueue = new Queue<string>(INDEX_QUEUE_NAME, REDIS_URL!, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 100 },
    removeOnComplete: 10_000,
    timeout: 10000
  }
});

async function enqueueUpdatedBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await indexQueue.add("index_updated", bsdId, options);
}

const formatTime = milliseconds => {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
  const hours = Math.floor((milliseconds / 1000 / 60 / 60) % 24);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0")
  ].join(":");
};

async function migrateBsdaFinalOperationCode() {
  console.log(
    "\n=== Migration BsdaFinalOperation operationCode: D 9 → D 9 F ==="
  );

  let updatedFinalOperations = 0;
  let errors = 0;

  const finalOperationsTotal = await prisma.bsdaFinalOperation.count({
    where: { operationCode: "D 9" }
  });

  console.log(
    `Total de ${finalOperationsTotal} BsdaFinalOperation à mettre à jour pour operationCode.`
  );

  if (finalOperationsTotal === 0) {
    console.log("Aucun BsdaFinalOperation à mettre à jour pour operationCode.");
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const finalOperations = await prisma.bsdaFinalOperation.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        operationCode: "D 9"
      },
      select: {
        id: true,
        initialBsdaId: true,
        finalBsdaId: true
      }
    });

    if (finalOperations.length === 0) {
      break;
    }

    const finalOperationIds = finalOperations.map(fo => fo.id);
    // Collect all unique BSDA IDs for reindexing (both initial and final)
    const bsdaIdsToReindex = [
      ...new Set([
        ...finalOperations.map(fo => fo.initialBsdaId),
        ...finalOperations.map(fo => fo.finalBsdaId)
      ])
    ];

    try {
      await prisma.bsdaFinalOperation.updateMany({
        where: { id: { in: finalOperationIds } },
        data: {
          operationCode: "D 9 F"
        }
      });

      // Re-index the associated BSDAAs (both initial and final)
      await Promise.allSettled(
        bsdaIdsToReindex.map(async bsdaId => {
          try {
            // await enqueueUpdatedBsdToIndex(bsdaId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdaId}`);
          }
        })
      );

      updatedFinalOperations += finalOperations.length;
      console.log(
        `operationCode: ${updatedFinalOperations}/${finalOperationsTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      console.log(
        `/!\\ Erreur operationCode batch ${finalOperationIds.join(", ")}: ${
          e.message
        }`
      );
    }
  }

  return { updated: updatedFinalOperations, errors };
}

export async function run() {
  console.log(
    ">> Lancement du script de mise à jour des BsdaFinalOperation: code D 9 devient D 9 F"
  );

  const startDate = new Date();

  // Execute the migration
  const finalOperationResults = await migrateBsdaFinalOperationCode();

  const duration = new Date().getTime() - startDate.getTime();

  console.log("\n=== RÉSUMÉ FINAL ===");
  console.log(
    `BsdaFinalOperation operationCode: ${finalOperationResults.updated} mis à jour, ${finalOperationResults.errors} erreurs`
  );
  console.log(
    `TOTAL: ${finalOperationResults.updated} final operations mis à jour, ${
      finalOperationResults.errors
    } erreurs en ${formatTime(duration)}!`
  );

  console.log("Terminé!");
}
