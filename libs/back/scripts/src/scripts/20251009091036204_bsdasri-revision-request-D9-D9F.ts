import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";

// TRA-16750: Migration des codes D9 vers D9F dans les BSDA & BSDASRI

// Estimated count in production: 1

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

export async function run() {
  console.log(
    ">> Lancement du script de mise à jour des BsdasriRevisionRequest: code D9 devient D9F, avec mode = ELIMINATION"
  );

  let updatedRevisionRequests = 0;
  let errors = 0;

  const startDate = new Date();

  const revisionRequestsTotal = await prisma.bsdasriRevisionRequest.count({
    where: { destinationOperationCode: "D9" }
  });

  console.log(
    `Total de ${revisionRequestsTotal} révisions DASRI à mettre à jour.`
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Always query from the beginning since updated records are filtered out
    const revisionRequests = await prisma.bsdasriRevisionRequest.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc" // Chronological order ensures consistent processing
      },
      where: {
        destinationOperationCode: "D9"
      },
      select: {
        id: true,
        bsdasriId: true
      }
    });

    if (revisionRequests.length === 0) {
      break;
    }

    const revisionRequestIds = revisionRequests.map(rr => rr.id);
    const bsdasriIds = [...new Set(revisionRequests.map(rr => rr.bsdasriId))]; // Unique BSDASRI IDs for reindexing

    try {
      // Update in DB
      await prisma.bsdasriRevisionRequest.updateMany({
        where: { id: { in: revisionRequestIds } },
        data: {
          destinationOperationCode: "D9F",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // Re-index the associated BSDADSRIs
      await Promise.allSettled(
        bsdasriIds.map(async bsdasriId => {
          try {
            await enqueueUpdatedBsdToIndex(bsdasriId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdasriId}`);
          }
        })
      );
    } catch (e) {
      errors++;

      console.log(
        `/!\\ Erreur for batch ${revisionRequestIds.join(", ")}: ${e.message}`
      );
    }

    updatedRevisionRequests += revisionRequests.length;

    const loopDuration = new Date().getTime() - startDate.getTime();
    console.log(
      `${updatedRevisionRequests} revision requests mis à jour (${Math.round(
        (updatedRevisionRequests / revisionRequestsTotal) * 100
      )}%) en ${formatTime(loopDuration)} (temps total estimé: ${formatTime(
        (loopDuration / updatedRevisionRequests) * revisionRequestsTotal
      )})`
    );
  }

  const duration = new Date().getTime() - startDate.getTime();

  console.log(
    `${updatedRevisionRequests} revision requests mis à jour, ${errors} erreurs (${Math.round(
      (errors / updatedRevisionRequests) * 100
    )}%) en ${formatTime(duration)}!`
  );

  console.log("Terminé!");
}
