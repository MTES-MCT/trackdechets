import logger from "../../logging/logger";
import { client, index as defaultIndexConfig } from "../../common/elastic";
import { IndexElasticSearchOpts } from "./types";
import { reindexAllBsdsNoDowntime } from "./reindexAllBsdsNoDowntime";
import { createNewIndex } from "./createNewIndex";

/**
 * Main function
 * Initialize the first index or re-index without downtime if mapping changed
 * Re-index in place (deleting & indexing again) for a single type of BSds
 */

export async function reindexAllBsdsInBulk({
  index = defaultIndexConfig,
  useQueue = false,
  force = false
}: IndexElasticSearchOpts): Promise<string> {
  const catAliasesResponse = await client.cat.aliases({
    name: index.alias,
    format: "json"
  });

  const aliasExists = catAliasesResponse.body.length > 0;
  if (!aliasExists) {
    // first time indexation for a new alias name
    const newIndex = await createNewIndex(index, useQueue);
    logger.info(`reindexAllBsdsInBulk done initializing a new index, exiting.`);
    return newIndex;
  } else {
    const newIndex = await reindexAllBsdsNoDowntime(index, force, useQueue);
    logger.info(
      `reindexAllBsdsInBulk done rolling out a new index without downtime, exiting.`
    );
    return newIndex;
  }
}
