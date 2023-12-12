import { Job, JobOptions } from "bull";
import { logger } from "@td/logger";
import { index as defaultIndexConfig } from "../../common/elastic";
import { indexQueue } from "../../queue/producers/elastic";
import prisma from "../../prisma";
import { closeQueues } from "../../queue/producers";
import { reindexAllBsdsInBulk } from "../../bsds/indexation";

/**
 * Main queuing function
 */
export async function addReindexAllInBulkJob(
  force: boolean
): Promise<Job<string>> {
  logger.info(
    `Enqueuing job indexAllInBulk to create a new index without downtime on server ${defaultIndexConfig.elasticSearchUrl}`
  );
  // default options can be overwritten by the calling function
  const jobOptions: JobOptions = {
    lifo: true,
    attempts: 1,
    timeout: 36_000_000 // 10h
  };
  const job = await indexQueue.add(
    "indexAllInBulk",
    JSON.stringify({
      index: defaultIndexConfig,
      force
    }),
    jobOptions
  );
  const isActive = await job.isActive();
  logger.info(
    `Done enqueuing job indexAllInBulk: Job ${job.id}, is currently active ? ${isActive}`
  );
  return job;
}

async function exitScript() {
  logger.info("Done reindexAllInBulk script, exiting");
  await prisma.$disconnect();
  await closeQueues();
  process.exit(0);
}

/**
 * Reindex all BSD with ou without the async job queue (--useQueue)
 */
(async function () {
  const force = process.argv.includes("--force") || process.argv.includes("-f");
  try {
    // launch job by chunks in the queue only if argument is specified
    const useQueue = process.argv.includes("--useQueue");
    if (useQueue) {
      /**
       * Le job est dans `back/src/queue/jobs/indexAllBsds.ts`
       * Si l'environnement du worker passe BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING=true
       * alors il est requis d'avoir aussi les autres variables présentes
       *  SCALINGO_API_URL,
       *  SCALINGO_APP_NAME,
       *  SCALINGO_TOKEN,
       *  BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING,
       *  BULK_INDEX_SCALINGO_CONTAINER_NAME,
       *  BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP,
       *  BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN,
       *  BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP,
       *  BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN
       */
      await addReindexAllInBulkJob(force);
    } else {
      // will index all BSD without downtime, only if need because of a mapping change
      await reindexAllBsdsInBulk({
        force,
        useQueue: false
      });
    }
  } catch (error) {
    logger.error("Error in reindexAllInBulk script, exiting", error);
    throw new Error(`Error in reindexAllInBulk script : ${error}`);
  } finally {
    await exitScript();
  }
})();
