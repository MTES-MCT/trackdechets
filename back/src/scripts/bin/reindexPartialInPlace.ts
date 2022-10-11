import { DateTime } from "luxon";
import prompts from "prompts";
import logger from "../../logging/logger";
import prisma from "../../prisma";
import { reindexPartialInPlace } from "../../bsds/indexation/bulkIndexBsds";
import { index } from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";
import { closeQueues } from "../../queue/producers";

const bsdTypes: BsdType[] = ["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"];

function doubleLog(msg: string, err?: any) {
  console.log(msg);
  logger.info(msg, err);
}

async function exitScript() {
  doubleLog("Finished reindex-in-place script, exiting");
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

  const matchIsoDate = args.filter(
    arg => arg.match(/^\d{4}-\d{2}-\d{2}$/)?.length > 0
  )[0];

  let since;
  if (matchIsoDate) {
    since = DateTime.fromISO(matchIsoDate);
    if (!since.isValid) since = undefined;
    else since = since.toJSDate();
  }

  try {
    if (bsdTypesToIndex.length > 1) {
      doubleLog("You can only specify one bsd type to index");
      return;
    }

    const bsdTypeToIndex = bsdTypesToIndex[0];

    if (!bsdTypeToIndex && !since) {
      doubleLog(
        "You can only target one bsd type OR a date since bsd were updated or created to target to index in place"
      );
      return;
    }
    if (force) {
      if (!bsdTypeToIndex) {
        doubleLog(
          "You can only force delete existing bsd when passing a BSD type as a command argument"
        );
        return;
      }
      await prompts({
        type: "confirm",
        name: "force",
        message:
          "Can you confirm to force delete bsds from the index before indexing them again ?",
        initial: false
      });
    }
    await reindexPartialInPlace(
      index,
      bsdTypeToIndex,
      force,
      useQueue,
      since ?? undefined
    );
  } catch (error) {
    doubleLog("reindex-in-place failed, error:", error);
  } finally {
    await exitScript();
  }
})();
