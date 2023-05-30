import { isValid, parseISO } from "date-fns";
import prompts from "prompts";
import logger from "../../logging/logger";
import prisma from "../../prisma";
import { reindexPartialInPlace } from "../../bsds/indexation/reindexPartialInPlace";
import { index } from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";
import { closeQueues } from "../../queue/producers";

const bsdTypes: BsdType[] = ["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"];

async function exitScript() {
  logger.info("Finished reindex-partial-in-place script, exiting");
  await prisma.$disconnect();
  await closeQueues();
  process.exit(0);
}

(async function () {
  const args = process.argv.slice(2);
  const force = args.includes("-f") || args.includes("--force");
  const useQueue = args.includes("--useQueue");
  const bsdTypesToIndex = bsdTypes.filter(t =>
    args.map(a => a.toUpperCase()).includes(t)
  );

  const matchIsoDate = args.filter(
    arg => (arg.match(/^\d{4}-\d{2}-\d{2}$/) ?? []).length > 0
  )[0];

  let since;
  if (matchIsoDate) {
    since = parseISO(matchIsoDate);
    if (!isValid(since)) {
      logger.info(
        "You must pass a Date in the following format '--since YYYY-MM-DD'"
      );
      await exitScript();
      return;
    }
  }

  try {
    if (bsdTypesToIndex.length > 1) {
      logger.info("You can only specify one bsd type to index");
      return;
    }

    const bsdTypeToIndex = bsdTypesToIndex[0];

    if (!bsdTypeToIndex && !since) {
      logger.info(
        "You can target whether one bsd type OR a date '--since YYYY-MM-DD' to target the re-indexation in place"
      );
      return;
    }
    if (force) {
      if (!bsdTypeToIndex) {
        logger.info(
          "You can only force delete existing bsd when passing a BSD type as a command argument"
        );
        return;
      }
      const { value } = await prompts({
        type: "confirm",
        name: "value",
        message:
          "Can you confirm to force delete bsds from the index before indexing them again ?",
        initial: false
      });
      if (!value) {
        process.exit(0);
      }
    }
    await reindexPartialInPlace(
      index,
      bsdTypeToIndex,
      force,
      useQueue,
      since ?? undefined
    );
  } catch (error) {
    logger.info("reindex-partial-in-place failed, error:", error);
  } finally {
    logger.info("Finished reindex-partial-in-place script, exiting");
    await exitScript();
  }
})();
