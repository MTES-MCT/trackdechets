import logger from "../../logging/logger";
import prisma from "../../prisma";
import { closeQueues } from "../../queue/producers";
import { enqueueAllBsdToIndex } from "../../queue/producers/elastic";

const { STARTUP_FILE } = process.env;

function doubleLog(msg) {
  console.log(msg);
  logger.info(msg);
}

async function exitScript() {
  doubleLog("Done enqueueReindexAllBsd script, exiting");
  await prisma.$disconnect();
  await closeQueues();
}

(async function () {
  if (!STARTUP_FILE || STARTUP_FILE === "dist/src/index.js") {
    doubleLog(
      "Abort index all BSDs because not in the api deployment, exiting"
    );
    return;
  }
  // launch reindex all job in the queue
  await enqueueAllBsdToIndex({
    // insert as first in the queue
    lifo: true,
    // more debug info
    stackTraceLimit: 100
  });
  await exitScript();
})();
