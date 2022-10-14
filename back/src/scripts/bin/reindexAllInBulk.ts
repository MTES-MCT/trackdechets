import logger from "../../logging/logger";
import prisma from "../../prisma";
import { closeQueues } from "../../queue/producers";
import { index } from "../../common/elastic";
import { reindexAllBsdsInBulk } from "../../bsds/indexation/bulkIndexBsds";
import { indexQueue } from "../../queue/producers/elastic";
import { JobOptions } from "bull";
const { STARTUP_FILE } = process.env;

async function exitScript() {
  logger.info("Done reindexAllInBulk script, exiting");
  await prisma.$disconnect();
  await closeQueues();
}

(async function () {
  const force = process.argv.includes("--force") || process.argv.includes("-f");
  const dev = process.argv.includes("--dev") || process.argv.includes("-d");
  // only meant to be used for api production deployment, exxcept if --dev is passed
  if (STARTUP_FILE && STARTUP_FILE !== "dist/src/index.js") {
    if (!!dev) {
      logger.info(
        "Starting reindexAllInBulk with --dev bypassing api deployment protection"
      );
    } else {
      logger.info(
        "Abort reindexAllInBulk: not in a TD api deployment ($STARTUP_FILE is not targeting the api server index.js)"
      );
      await exitScript();
      return;
    }
  }
  try {
    // launch job by chunks in the queue only if argument is specified
    const useQueue = process.argv.includes("--useQueue");
    if (useQueue) {
      logger.info(`Enqueuing indexation of all bsds in bulk without downtime`);
      // default options can be overwritten by the calling function
      const jobOptions: JobOptions = {
        lifo: true,
        attempts: 1,
        timeout: 36_000_000 // 10h
      };
      await indexQueue.add(
        "indexAllInBulk",
        JSON.stringify({
          index,
          force
        }),
        jobOptions
      );
      await exitScript();
      return;
    }
    // will index all BSD without downtime, only if need because of a mapping change
    await reindexAllBsdsInBulk({
      index,
      force,
      useQueue: false
    });
  } catch (error) {
    throw new Error(`Error in reindexAllInBulk script : ${error}`);
  } finally {
    await exitScript();
  }
})();
