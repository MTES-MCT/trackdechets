import logger from "../../logging/logger";
import prisma from "../../prisma";
import { enqueueAllBsdToIndex } from "../../queue/producers/elastic";

const { STARTUP_FILE } = process.env;

function doubleLog(msg) {
  console.log(msg);
  logger.info(msg);
}

async function exitScript(exitCode: number) {
  doubleLog("Done enqueueReindexAllBsd script, exiting");
  await prisma.$disconnect();
  process.exit(exitCode);
}

(async function () {
  if (!STARTUP_FILE || STARTUP_FILE === "dist/src/index.js") {
    doubleLog(
      "Abort index all BSDs because not in the api deployment, exiting"
    );
    await exitScript(0);
    return;
  }
  // launch reindex all job in the queue
  await enqueueAllBsdToIndex({
    // insert as first in the queue
    lifo: true,
    // 4h
    timeout: 1000 * 60 * 60 * 4,
    // more debug info
    stackTraceLimit: 100
  });
  await exitScript(1);
  return;
})();
