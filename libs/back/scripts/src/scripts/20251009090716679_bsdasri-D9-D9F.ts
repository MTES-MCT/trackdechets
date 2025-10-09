import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";

// TRA-16750: Migration des codes D9 vers D9F dans les BSDA & BSDASRI

// Estimated count in production: 371 447

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

export async function run() {
  console.log(
    ">> Lancement du script de mise à jour des BSDASRI: code D9 devient D9F, avec mode = ELIMINATION"
  );

  let updatedBsdasris = 0;
  let errors = 0;

  const startDate = new Date();

  const bsdasrisTotal = await prisma.bsdasri.count({
    where: { destinationOperationCode: "D9" }
  });

  console.log(`Total de ${bsdasrisTotal} BSDASRI à mettre à jour.`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Always query from the beginning since updated records are filtered out
    const bsdasris = await prisma.bsdasri.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc" // Chronological order ensures consistent processing
      },
      where: {
        destinationOperationCode: "D9"
      },
      select: {
        id: true
      }
    });

    if (bsdasris.length === 0) {
      break;
    }

    const bsdIds = bsdasris.map(bsdasri => bsdasri.id);

    try {
      // Update in DB
      await prisma.bsdasri.updateMany({
        where: { id: { in: bsdIds } },
        data: {
          destinationOperationCode: "D9F",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // Re-index
      await Promise.allSettled(
        bsdIds.map(async bsdId => {
          try {
            await enqueueUpdatedBsdToIndex(bsdId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdId}`);
          }
        })
      );
    } catch (e) {
      errors++;

      console.log(`/!\\ Erreur for batch ${bsdIds.join(", ")}: ${e.message}`);
    }

    updatedBsdasris += bsdIds.length;
    // Don't increment skip here - we'll keep querying the same position since records get filtered out

    const loopDuration = new Date().getTime() - startDate.getTime();
    console.log(
      `${updatedBsdasris} bsdasris mis à jour (${Math.round(
        (updatedBsdasris / bsdasrisTotal) * 100
      )}%) en ${formatTime(loopDuration)} (temps total estimé: ${formatTime(
        (loopDuration / updatedBsdasris) * bsdasrisTotal
      )})`
    );
  }

  const duration = new Date().getTime() - startDate.getTime();

  console.log(
    `${updatedBsdasris} bsdasris mis à jour, ${errors} erreurs (${Math.round(
      (errors / updatedBsdasris) * 100
    )}%) en ${formatTime(duration)}!`
  );

  console.log("Terminé!");
}
