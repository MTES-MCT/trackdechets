import { indexElasticSearch } from "./indexElasticSearch.helpers";
import { index } from "../../common/elastic";
import { closeQueues } from "../../queue/producers";
import { BsdType } from "../../generated/graphql/types";
import logger from "../../logging/logger";
const bsdTypes: BsdType[] = ["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"];

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
    if (!!bsdTypesToIndex.length && !force) {
      logger.error(
        "When you specify a bsd type, you must pass the -f argument to reindex in place"
      );
      return;
    }
    const bsdTypeToIndex = bsdTypesToIndex[0];

    await indexElasticSearch({ force, index, bsdTypeToIndex });
  } catch (error) {
    logger.error("ES indexation failed, error:", error);
  } finally {
    await closeQueues();
  }
})();
