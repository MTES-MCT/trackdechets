import { logger } from "@td/logger";
import { client, BsdIndexationConfig } from "../../common/elastic";
import { declareNewIndex, indexAllBsds } from "./bulkIndexBsds";

/**
 * Creates a brand new index and alias from scratch
 * Applies for empty Elasticsearch servers
 */

export async function createNewIndex(
  index: BsdIndexationConfig,
  useQueue = false
): Promise<string> {
  const newIndex = await declareNewIndex(index);
  await client.indices.putAlias({
    name: index.alias,
    index: newIndex
  });
  logger.info(
    `All BSDs are being indexed in the new index "${newIndex}" with alias "${index.alias}".`
  );
  await indexAllBsds(newIndex, index, useQueue);
  // restore index settings to defaults
  await client.indices.putSettings({
    index: newIndex,
    body: {
      settings: {
        index: {
          refresh_interval: "1s",
          number_of_replicas: 1
        }
      }
    }
  });
  logger.info(
    `Created the alias "${index.alias}" pointing to the new index "${newIndex}"`
  );
  return newIndex;
}
