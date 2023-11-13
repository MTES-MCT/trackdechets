import { logger } from "@td/logger";
import { client, BsdIndexationConfig } from "../../common/elastic";
import {
  isIndexMappingsVersionChanged,
  declareNewIndex,
  indexAllBsds,
  attachNewIndexAndcleanOldIndexes
} from "./bulkIndexBsds";

/**
 * Bump a new index. During indexation, the alias still points to the old index
 * to avoid read downtimes. At the end of the indexation, the alias is reconfigured to
 * point to the new index.
 */

export async function reindexAllBsdsNoDowntime(
  index: BsdIndexationConfig,
  force: boolean,
  useQueue = false
): Promise<string> {
  const mappingChanged = await isIndexMappingsVersionChanged(index);
  if (mappingChanged || force) {
    // index a new version and roll-over on the same alias without downtime
    const newIndex = await declareNewIndex(index);
    logger.info(
      `BSD are being indexed in the new index "${newIndex}" while the alias "${index.alias}" still points to the current index on server ${index.elasticSearchUrl}`
    );

    await indexAllBsds(newIndex, index, useQueue);
    await attachNewIndexAndcleanOldIndexes(index, newIndex);
    // restore index settings to defaults
    await client.indices.putSettings({
      index: newIndex,
      body: {
        settings: {
          index: {
            // refresh and replcation was disabled on start to optimize for indexing speed
            refresh_interval: "1s",
            number_of_replicas: 2
          }
        }
      }
    });
    return newIndex;
  } else {
    logger.info(
      `reindexAll script has nothing to do, no mappings changes detected nor --force argument passed`
    );
    return index.alias;
  }
}
