import logger from "../../logging/logger";
// only meant to be executed for the api deployment, not notifier, except if --dev is passed
// notifier deployment has STARTUP_FILE set to "dist/src/notifier/index.js"
const { STARTUP_FILE } = process.env;
const dev = process.argv.includes("--dev") || process.argv.includes("-d");

if (STARTUP_FILE && STARTUP_FILE !== "dist/src/index.js") {
  if (!!dev) {
    logger.info(
      "Starting reindexAllInBulk with --dev bypassing api deployment protection"
    );
  } else {
    logger.info(
      "Abort reindexAllInBulk: not in a TD api deployment ($STARTUP_FILE is not targeting the api server index.js)"
    );
    process.exit(0);
  }
}

import prisma from "../../prisma";
import { closeQueues } from "../../queue/producers";
import {
  reindexAllBsdsInBulk,
  addReindexAllInBulkJob
} from "../../bsds/indexation/bulkIndexBsds";

async function exitScript() {
  logger.info("Done reindexAllInBulk script, exiting");
  await prisma.$disconnect();
  await closeQueues();
  process.exit(0);
}

(async function () {
  const force = process.argv.includes("--force") || process.argv.includes("-f");
  try {
    // launch job by chunks in the queue only if argument is specified
    const useQueue = process.argv.includes("--useQueue");
    if (useQueue) {
      await addReindexAllInBulkJob(force);
      await exitScript();
      return;
    }
    // will index all BSD without downtime, only if need because of a mapping change
    await reindexAllBsdsInBulk({
      force,
      useQueue: false
    });
  } catch (error) {
    throw new Error(`Error in reindexAllInBulk script : ${error}`);
  } finally {
    await exitScript();
  }
})();
