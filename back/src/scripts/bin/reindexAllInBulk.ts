import logger from "../../logging/logger";
import prisma from "../../prisma";
import { closeQueues } from "../../queue/producers";
import { index } from "../../common/elastic";
import { reindexAllBsdsInBulk } from "../../bsds/indexation/bulkIndexBsds";
import { indexQueue } from "../../queue/producers/elastic";
import { JobOptions } from "bull";
const { STARTUP_FILE } = process.env;

function doubleLog(msg) {
  console.log(msg);
  logger.info(msg);
}

async function exitScript() {
  doubleLog("Done reindexAllInBulk script, exiting");
  await prisma.$disconnect();
  await closeQueues();
}

(async function () {
  const force = process.argv.includes("--force") || process.argv.includes("-f");
  // only meant to be used for api production deployment
  if (!force && (!STARTUP_FILE || STARTUP_FILE === "dist/src/index.js")) {
    doubleLog(
      "Abort index all BSDs because not in a TD api deployment, exiting"
    );
    return;
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
  }
  await exitScript();
})();
