import logger from "../../logging/logger";
import prisma from "../../prisma";
import { closeQueues } from "../../queue/producers";
import { index } from "../../common/elastic";
import { indexElasticSearch } from "../../scripts/bin/indexElasticSearch.helpers";
const { STARTUP_FILE } = process.env;

function doubleLog(msg) {
  console.log(msg);
  logger.info(msg);
}

async function exitScript() {
  doubleLog("Done enqueueReindexAllBsds script, exiting");
  await prisma.$disconnect();
  await closeQueues();
}

(async function () {
  // script meant to be used for production deployment
  if (!STARTUP_FILE || STARTUP_FILE === "dist/src/index.js") {
    doubleLog(
      "Abort index all BSDs because not in the api deployment, exiting"
    );
    return;
  }
  try {
    // launch reindex all job by chunks in the queue only if argument is specified
    const useQueue = process.argv.includes("--useQueue");
    // will index all BSD without downtime, only if need because of a mapping change
    await indexElasticSearch({
      index,
      force: false,
      useQueue
    });
  } catch (error) {
    throw new Error(`Error in enqueueReindexAllBsds script : ${error}`);
  }
  await exitScript();
})();
