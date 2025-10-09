import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";

// Estimated count for destinationPlannedOperationCode in production: 5 292
// Estimated count for destinationOperationCode in production: 162
// Estimated count for destinationOperationNextDestinationPlannedOperationCode in production: 1 624

// Fine-tune the batch size here
const BATCH_SIZE = 1000;

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

async function migratePlannedOperationCode() {
  logger.info(
    "\n=== Migration destinationPlannedOperationCode: D 9 → D 9 F ==="
  );

  let updatedBsdas = 0;
  let errors = 0;

  const bsdasTotal = await prisma.bsda.count({
    where: { destinationPlannedOperationCode: "D 9" }
  });

  logger.info(
    `Total de ${bsdasTotal} BSDA à mettre à jour pour destinationPlannedOperationCode.`
  );

  if (bsdasTotal === 0) {
    logger.info(
      "Aucun BSDA à mettre à jour pour destinationPlannedOperationCode."
    );
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const bsdas = await prisma.bsda.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        destinationPlannedOperationCode: "D 9"
      },
      select: {
        id: true
      }
    });

    if (bsdas.length === 0) {
      break;
    }

    const bsdIds = bsdas.map(bsda => bsda.id);

    try {
      await prisma.bsda.updateMany({
        where: { id: { in: bsdIds } },
        data: {
          destinationPlannedOperationCode: "D 9 F"
        }
      });

      await Promise.allSettled(
        bsdIds.map(async bsdId => {
          try {
            await enqueueUpdatedBsdToIndex(bsdId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdId}`);
          }
        })
      );

      updatedBsdas += bsdIds.length;
      logger.info(
        `destinationPlannedOperationCode: ${updatedBsdas}/${bsdasTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      logger.info(
        `/!\\ Erreur destinationPlannedOperationCode batch ${bsdIds.join(
          ", "
        )}: ${e.message}`
      );
    }
  }

  return { updated: updatedBsdas, errors };
}

async function migrateOperationCode() {
  logger.info(
    "\n=== Migration destinationOperationCode: D 9 → D 9 F + mode ELIMINATION ==="
  );

  let updatedBsdas = 0;
  let errors = 0;

  const bsdasTotal = await prisma.bsda.count({
    where: { destinationOperationCode: "D 9" }
  });

  logger.info(
    `Total de ${bsdasTotal} BSDA à mettre à jour pour destinationOperationCode.`
  );

  if (bsdasTotal === 0) {
    logger.info("Aucun BSDA à mettre à jour pour destinationOperationCode.");
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const bsdas = await prisma.bsda.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        destinationOperationCode: "D 9"
      },
      select: {
        id: true
      }
    });

    if (bsdas.length === 0) {
      break;
    }

    const bsdIds = bsdas.map(bsda => bsda.id);

    try {
      await prisma.bsda.updateMany({
        where: { id: { in: bsdIds } },
        data: {
          destinationOperationCode: "D 9 F",
          destinationOperationMode: "ELIMINATION"
        }
      });

      await Promise.allSettled(
        bsdIds.map(async bsdId => {
          try {
            await enqueueUpdatedBsdToIndex(bsdId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdId}`);
          }
        })
      );

      updatedBsdas += bsdIds.length;
      logger.info(
        `destinationOperationCode: ${updatedBsdas}/${bsdasTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      logger.info(
        `/!\\ Erreur destinationOperationCode batch ${bsdIds.join(", ")}: ${
          e.message
        }`
      );
    }
  }

  return { updated: updatedBsdas, errors };
}

async function migrateNextDestinationPlannedOperationCode() {
  logger.info(
    "\n=== Migration destinationOperationNextDestinationPlannedOperationCode: D 9 → D 9 F ==="
  );

  let updatedBsdas = 0;
  let errors = 0;

  const bsdasTotal = await prisma.bsda.count({
    where: { destinationOperationNextDestinationPlannedOperationCode: "D 9" }
  });

  logger.info(
    `Total de ${bsdasTotal} BSDA à mettre à jour pour destinationOperationNextDestinationPlannedOperationCode.`
  );

  if (bsdasTotal === 0) {
    logger.info(
      "Aucun BSDA à mettre à jour pour destinationOperationNextDestinationPlannedOperationCode."
    );
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const bsdas = await prisma.bsda.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        destinationOperationNextDestinationPlannedOperationCode: "D 9"
      },
      select: {
        id: true
      }
    });

    if (bsdas.length === 0) {
      break;
    }

    const bsdIds = bsdas.map(bsda => bsda.id);

    try {
      await prisma.bsda.updateMany({
        where: { id: { in: bsdIds } },
        data: {
          destinationOperationNextDestinationPlannedOperationCode: "D 9 F"
        }
      });

      await Promise.allSettled(
        bsdIds.map(async bsdId => {
          try {
            await enqueueUpdatedBsdToIndex(bsdId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdId}`);
          }
        })
      );

      updatedBsdas += bsdIds.length;
      logger.info(
        `destinationOperationNextDestinationPlannedOperationCode: ${updatedBsdas}/${bsdasTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      logger.info(
        `/!\\ Erreur destinationOperationNextDestinationPlannedOperationCode batch ${bsdIds.join(
          ", "
        )}: ${e.message}`
      );
    }
  }

  return { updated: updatedBsdas, errors };
}

export async function run() {
  logger.info(
    ">> Lancement du script de mise à jour des BSDA: codes D 9 deviennent D 9 F"
  );

  const startDate = new Date();

  // Execute all three migrations
  const plannedResults = await migratePlannedOperationCode();
  const operationResults = await migrateOperationCode();
  const nextDestinationResults =
    await migrateNextDestinationPlannedOperationCode();

  const duration = new Date().getTime() - startDate.getTime();
  const totalUpdated =
    plannedResults.updated +
    operationResults.updated +
    nextDestinationResults.updated;
  const totalErrors =
    plannedResults.errors +
    operationResults.errors +
    nextDestinationResults.errors;

  logger.info("\n=== RÉSUMÉ FINAL ===");
  logger.info(
    `destinationPlannedOperationCode: ${plannedResults.updated} mis à jour, ${plannedResults.errors} erreurs`
  );
  logger.info(
    `destinationOperationCode: ${operationResults.updated} mis à jour, ${operationResults.errors} erreurs`
  );
  logger.info(
    `destinationOperationNextDestinationPlannedOperationCode: ${nextDestinationResults.updated} mis à jour, ${nextDestinationResults.errors} erreurs`
  );
  logger.info(
    `TOTAL: ${totalUpdated} bsdas mis à jour, ${totalErrors} erreurs en ${formatTime(
      duration
    )}!`
  );

  logger.info("Terminé!");
}
