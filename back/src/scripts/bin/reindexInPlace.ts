import logger from "../../logging/logger";
import prisma from "../../prisma";
import { reindexInPlace } from "../../bsds/indexation/bulkIndexBsds";
import { index } from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";
import { closeQueues } from "../../queue/producers";

const bsdTypes: BsdType[] = ["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"];

function doubleLog(msg: string, err?: any) {
  console.log(msg);
  logger.info(msg, err);
}

async function exitScript() {
  doubleLog("Finished reindexInPlace script, exiting");
  await prisma.$disconnect();
  await closeQueues();
}

(async function () {
  const args = process.argv.slice(2);
  const force = args.includes("-f") || args.includes("--force");
  const useQueue = args.includes("--useQueue");
  const bsdTypesToIndex = bsdTypes.filter(t =>
    args.map(a => a.toUpperCase()).includes(t)
  );

  try {
    if (bsdTypesToIndex.length > 1) {
      logger.error("You can only specify one bsd type to index");
      return;
    }

    const bsdTypeToIndex = bsdTypesToIndex[0];

    if ((!!bsdTypeToIndex && !force) || (force && !bsdTypeToIndex)) {
      logger.error(
        "When you specify a bsd type to reindex inplace, you must pass --force/-f to confirm deleting from the current index."
      );
      return exitScript();
    }
    // TODO implement Date parsing to pass since as arg
    await reindexInPlace(index, bsdTypeToIndex, undefined, force, useQueue);
  } catch (error) {
    doubleLog("reindexInPlace failed, error:", error);
  } finally {
    await exitScript();
  }
})();
