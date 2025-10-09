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
  logger.info(`Enqueuing BSD ${bsdId} for indexation`);
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

async function migrateBsdasriFinalOperationCode() {
  logger.info(
    "\n=== Migration BsdasriFinalOperation operationCode: D9 → D9F ==="
  );

  let updatedFinalOperations = 0;
  let errors = 0;

  const finalOperationsTotal = await prisma.bsdasriFinalOperation.count({
    where: { operationCode: "D9" }
  });

  logger.info(
    `Total de ${finalOperationsTotal} BsdasriFinalOperation à mettre à jour pour operationCode.`
  );

  if (finalOperationsTotal === 0) {
    logger.info(
      "Aucun BsdasriFinalOperation à mettre à jour pour operationCode."
    );
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const finalOperations = await prisma.bsdasriFinalOperation.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        operationCode: "D9"
      },
      select: {
        id: true,
        initialBsdasriId: true,
        finalBsdasriId: true
      }
    });

    if (finalOperations.length === 0) {
      break;
    }

    const finalOperationIds = finalOperations.map(fo => fo.id);
    // Collect all unique BSDASRI IDs for reindexing (both initial and final)
    const bsdasriIdsToReindex = [
      ...new Set([
        ...finalOperations.map(fo => fo.initialBsdasriId),
        ...finalOperations.map(fo => fo.finalBsdasriId)
      ])
    ];

    try {
      await prisma.bsdasriFinalOperation.updateMany({
        where: { id: { in: finalOperationIds } },
        data: {
          operationCode: "D9F"
        }
      });

      // Re-index the associated BSDASRI (both initial and final)
      await Promise.allSettled(
        bsdasriIdsToReindex.map(async bsdasriId => {
          try {
            await enqueueUpdatedBsdToIndex(bsdasriId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdasriId}`);
          }
        })
      );

      updatedFinalOperations += finalOperations.length;
      logger.info(
        `operationCode: ${updatedFinalOperations}/${finalOperationsTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      logger.info(
        `/!\\ Erreur operationCode batch ${finalOperationIds.join(", ")}: ${
          e.message
        }`
      );
    }
  }

  return { updated: updatedFinalOperations, errors };
}

export async function run() {
  logger.info(
    ">> Lancement du script de mise à jour des BsdasriFinalOperation: code D9 devient D9F"
  );

  const startDate = new Date();

  // Execute the migration
  const finalOperationResults = await migrateBsdasriFinalOperationCode();

  const duration = new Date().getTime() - startDate.getTime();

  logger.info("\n=== RÉSUMÉ FINAL ===");
  logger.info(
    `BsdasriFinalOperation operationCode: ${finalOperationResults.updated} mis à jour, ${finalOperationResults.errors} erreurs`
  );
  logger.info(
    `TOTAL: ${finalOperationResults.updated} final operations mis à jour, ${
      finalOperationResults.errors
    } erreurs en ${formatTime(duration)}!`
  );

  logger.info("Terminé!");
}
