import { logger } from "@td/logger";
import { client, BsdIndexationConfig } from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";
import { indexAllBsds } from "./bulkIndexBsds";

/**
 * Reindex all or given bsd type documents "in place" in the current index. Useful when
 * you want to force a reindex without bumping index version.
 * WARNING : it will cause a read downtime during the time of the reindex.
 */

export async function reindexPartialInPlace(
  index: BsdIndexationConfig,
  bsdType: BsdType,
  force = false,
  useQueue = false,
  since?: Date
) {
  // avoid unwanted deletion
  if (bsdType && force && !since) {
    logger.info(`Deleting ${bsdType} entries`);
    await client.deleteByQuery(
      {
        index: index.alias,
        body: {
          query: {
            match: {
              type: bsdType
            }
          }
        },
        refresh: true
      },
      {
        // do not throw an error if a document has been updated during delete operation
        ignore: [409]
      }
    );
  }
  logger.info(
    `Reindex in place ${bsdType ? bsdType + " " : " "}${
      since ? "since" : ""
    } ${since}`
  );
  await indexAllBsds(index.alias, index, useQueue, bsdType, since);
}
