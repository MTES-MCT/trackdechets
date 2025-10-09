import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";

// Estimated count in production: 12

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

async function migrateBsdaRevisionRequestOperationCode() {
  logger.info(
    "\n=== Migration BsdaRevisionRequest destinationOperationCode: D 9 → D 9 F + mode ELIMINATION ==="
  );

  let updatedRevisionRequests = 0;
  let errors = 0;

  const revisionRequestsTotal = await prisma.bsdaRevisionRequest.count({
    where: { destinationOperationCode: "D 9" }
  });

  logger.info(
    `Total de ${revisionRequestsTotal} BsdaRevisionRequest à mettre à jour pour destinationOperationCode.`
  );

  if (revisionRequestsTotal === 0) {
    logger.info(
      "Aucun BsdaRevisionRequest à mettre à jour pour destinationOperationCode."
    );
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const revisionRequests = await prisma.bsdaRevisionRequest.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        destinationOperationCode: "D 9"
      },
      select: {
        id: true,
        bsdaId: true
      }
    });

    if (revisionRequests.length === 0) {
      break;
    }

    const revisionRequestIds = revisionRequests.map(rr => rr.id);
    const bsdaIds = [...new Set(revisionRequests.map(rr => rr.bsdaId))]; // Unique BSDA IDs for reindexing

    try {
      await prisma.bsdaRevisionRequest.updateMany({
        where: { id: { in: revisionRequestIds } },
        data: {
          destinationOperationCode: "D 9 F",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // Re-index the associated BSDAAs
      await Promise.allSettled(
        bsdaIds.map(async bsdaId => {
          try {
            await enqueueUpdatedBsdToIndex(bsdaId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdaId}`);
          }
        })
      );

      updatedRevisionRequests += revisionRequests.length;
      logger.info(
        `destinationOperationCode: ${updatedRevisionRequests}/${revisionRequestsTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      logger.info(
        `/!\\ Erreur destinationOperationCode batch ${revisionRequestIds.join(
          ", "
        )}: ${e.message}`
      );
    }
  }

  return { updated: updatedRevisionRequests, errors };
}

export async function run() {
  logger.info(
    ">> Lancement du script de mise à jour des BsdaRevisionRequest: code D 9 devient D 9 F + mode ELIMINATION"
  );

  const startDate = new Date();

  // Execute the migration
  const revisionResults = await migrateBsdaRevisionRequestOperationCode();

  const duration = new Date().getTime() - startDate.getTime();

  logger.info("\n=== RÉSUMÉ FINAL ===");
  logger.info(
    `BsdaRevisionRequest destinationOperationCode: ${revisionResults.updated} mis à jour, ${revisionResults.errors} erreurs`
  );
  logger.info(
    `TOTAL: ${revisionResults.updated} revision requests mis à jour, ${
      revisionResults.errors
    } erreurs en ${formatTime(duration)}!`
  );

  logger.info("Terminé!");
}
