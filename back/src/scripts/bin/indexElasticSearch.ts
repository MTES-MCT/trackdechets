import logger from "../../logging/logger";
import prisma from "../../prisma";
import { indexElasticSearch } from "./indexElasticSearch.helpers";
import { index } from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";
import { closeQueues } from "../../queue/producers";

const bsdTypes: BsdType[] = ["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"];

function doubleLog(msg: string, err?: any) {
  console.log(msg);
  logger.info(msg, err);
}

async function exitScript(exitCode: number) {
  doubleLog("Finished indexElasticSearch script, exiting");
  await prisma.$disconnect();
  process.exit(exitCode);
}

(async function () {
  const args = process.argv.slice(2);
  const force = args.includes("-f");
  const bsdTypesToIndex = bsdTypes.filter(t =>
    args.map(a => a.toUpperCase()).includes(t)
  );

  try {
    if (bsdTypesToIndex.length > 1) {
      logger.error("You can only specify one bsd type to index");
      return;
    }

    const bsdTypeToIndex = bsdTypesToIndex[0];
    await indexElasticSearch({ force, index, bsdTypeToIndex });
    await exitScript(1);
  } catch (error) {
    doubleLog("ES indexation failed, error:", error);
    await exitScript(0);
  } finally {
    await closeQueues();
  }
})();
