import type { ApiResponse } from "@elastic/elasticsearch";
import logger from "../../logging/logger";
import { client, indexAllBsds, BsdIndex } from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";

/**
 * Separators constants
 * If changed, breaks the script roll-over system
 * BETTER NOT change in production
 */
export const INDEX_ALIAS_NAME_SEPARATOR = "_";
export const INDEX_DATETIME_SEPARATOR = "===";

/**
 * Convert Date to readable index version name suffixe
 */
const getIndexDateString = (dateStr?: string) => {
  let dateObj;
  if (dateStr) {
    dateObj = new Date(dateStr);
  } else {
    dateObj = new Date();
  }

  return dateObj
    .toJSON()
    .replace(/\:/g, INDEX_DATETIME_SEPARATOR)
    .toLowerCase();
};

/**
 * Convert index name to the Date object of its creation time
 */
const getIndexDateFromName = (indexName: string): Date => {
  // Datetime is the last fragment in the index name
  const indexDateString = indexName.split(INDEX_ALIAS_NAME_SEPARATOR).pop();
  return new Date(
    indexDateString
      .toUpperCase()
      .replace(new RegExp(INDEX_DATETIME_SEPARATOR, "g"), ":")
  );
};

/**
 * Convert index name to the mappings version name
 */
const getIndexMappingsVersionFromName = (indexName: string): string =>
  indexName.split(INDEX_ALIAS_NAME_SEPARATOR)[1];

/**
 * Build a codified index name
 */
const getIndexName = (index: BsdIndex, dateStr?: string): string =>
  `${index.alias}${INDEX_ALIAS_NAME_SEPARATOR}${
    index.mappings_version
  }${INDEX_ALIAS_NAME_SEPARATOR}${
    process.env.NODE_ENV ? process.env.NODE_ENV : "dev"
  }${INDEX_ALIAS_NAME_SEPARATOR}${getIndexDateString(dateStr)}`;

/**
 * Create index on ES
 */
async function declareNewIndex(index: BsdIndex) {
  const newIndex = getIndexName(index);
  await client.indices.create({
    index: newIndex,
    body: {
      mappings: { [index.type]: index.mappings },
      settings: index.settings
    }
  });
  return newIndex;
}

/**
 * Clean older indexes and attach the newest one to the alias
 */
export const attachNewIndexAndcleanOldIndexes = async (
  index: BsdIndex,
  newIndex: string
) => {
  const aliases = await client.cat.aliases({
    name: index.alias,
    format: "json"
  });
  const bindedIndexes = aliases.body.map((info: { index: any }) => info.index);
  logger.info(
    `Pointing the index alias "${index.alias}" to the new index "${newIndex}".`
  );
  // update alias actions consistently
  client.indices.updateAliases({
    body: {
      actions: [
        ...(bindedIndexes.length
          ? [{ remove: { indices: bindedIndexes, alias: index.alias } }]
          : []),
        { add: { index: newIndex, alias: index.alias } }
      ]
    }
  });
  if (bindedIndexes.length) {
    logger.info(
      `Removed alias pointers to older indices : ${bindedIndexes.join(", ")}.`
    );
  }
  // Delete all old indices to save disk space, except the last
  const indices = await client.cat.indices({
    index: `${index.alias}${INDEX_ALIAS_NAME_SEPARATOR}*`,
    format: "json"
  });
  // Indices sorted by Date of creation
  const oldIndices: Date[] = indices.body
    .map((info: { index: string }) => info.index)
    // Exclude the current newIndex
    .filter((index: string) => index !== newIndex)
    .map((name: string) => getIndexDateFromName(name))
    .sort();

  // keep the last index in order to rollback if rescue needed
  const keptIndex = getIndexName(index, oldIndices.pop().toJSON());
  logger.info(
    `Keeping previous index "${keptIndex}" if a rescue rollback is needed use: curl -X PUT http://elasticsearch.url/${keptIndex}/alias/${index.alias}`
  );
  if (oldIndices.length) {
    const oldIndicesNames = oldIndices.map(oldIndex =>
      getIndexName(index, oldIndex.toJSON())
    );
    logger.info(
      `Removing ${oldIndices.length} old index : ${oldIndicesNames.join(",")}`
    );

    await Promise.all(
      oldIndicesNames.map(async index => {
        try {
          await client.indices.delete({
            index
          });
        } catch (e) {
          logger.error(e);
        }
      })
    );
  }
};

/**
 * Detect mappings changes the declared version
 */
async function isIndexMappingsVersionChanged(
  index: BsdIndex
): Promise<boolean> {
  const aliases: ApiResponse<Array<{ index: string }>> =
    await client.cat.aliases({
      name: index.alias,
      format: "json"
    });

  if (!aliases?.body.length) {
    logger.warning(`No aliases found during mapping change detection`);
    return true;
  }

  const mostRecentIndexDateAndVersion: {
    date: Date;
    mappings_version: string;
  } = aliases?.body
    .map(info => info.index)
    .map((name: string) => ({
      date: getIndexDateFromName(name),
      mappings_version: getIndexMappingsVersionFromName(name)
    }))
    .sort((a, b) => {
      if (a.date === b.date) {
        return 0;
      }
      if (a.date < b.date) {
        return -1;
      } else {
        return 1;
      }
    })
    .reverse()[0];

  if (
    mostRecentIndexDateAndVersion?.mappings_version &&
    getIndexMappingsVersionFromName(
      mostRecentIndexDateAndVersion.mappings_version
    ) === index.mappings_version
  ) {
    logger.info(
      `No mappings version change was detected for index "${index.alias}".`
    );
    return false;
  } else {
    logger.info(
      `Mappings version change has been detected for index "${index.alias}".`
    );
    return true;
  }
}

/**
 * Reindex all or given bsd type documents "in place" in the current index. Useful when
 * you want to force a reindex without bumping index version.
 * WARNING : it will cause a read downtime during the time of the reindex.
 */
async function reindexInPlace(
  index: BsdIndex,
  bsdType: BsdType,
  force = false,
  useQueue = false
) {
  if (force) {
    let query = {};
    if (bsdType) {
      logger.info(`Deleting ${bsdType} entries`);
      query = {
        match: {
          type: bsdType
        }
      };
    } else {
      logger.info(`Deleting all entries`);
      query = { match_all: {} };
    }

    await client.deleteByQuery({
      index: index.alias,
      body: { query: query }
    });
  }
  await indexAllBsds(index.alias, bsdType, useQueue);
}

/**
 * Bump a new index. During indexation, the alias still points to the old index
 * to avoid read downtimes. At the end of the indexation, the alias is reconfigured to
 * point to the new index.
 */
async function reindexRollover(
  index: BsdIndex,
  force: boolean,
  useQueue = false
) {
  const mappingChanged = await isIndexMappingsVersionChanged(index);
  if (mappingChanged || force) {
    // index a new version and roll-over on the same alias without downtime
    const newIndex = await declareNewIndex(index);

    logger.info(
      `BSD are being indexed in the new index "${newIndex}" while the alias "${index.alias}" still points to the current index.`
    );

    await indexAllBsds(newIndex, undefined, useQueue);
    await attachNewIndexAndcleanOldIndexes(index, newIndex);
  } else {
    logger.info(
      `indexElasticSearch script has nothing to do, no mappings changes detected nor --force argument passed`
    );
  }
}

/**
 * Creates a brand new index and alias from scratch
 */
async function initializeIndex(index: BsdIndex, useQueue = false) {
  const newIndex = await declareNewIndex(index);
  logger.info(`All BSDs are being indexed in the new index "${newIndex}".`);

  await indexAllBsds(newIndex, undefined, useQueue);
  logger.info(
    `Created the alias "${index.alias}" pointing to the new index "${newIndex}"`
  );

  await client.indices.putAlias({
    name: index.alias,
    index: newIndex
  });
}

type IndexElasticSearchOpts = {
  index: BsdIndex;
  bsdTypeToIndex?: BsdType;
  force?: boolean;
  useQueue?: boolean;
};

/**
 * Main function
 * Initialize the first index or re-index without downtime if mapping changed
 * Re-index in place (deleting & indexing again) for a single type of BSds
 */
export async function indexElasticSearch({
  index,
  force = false,
  bsdTypeToIndex,
  useQueue = false
}: IndexElasticSearchOpts) {
  const catAliasesResponse = await client.cat.aliases({
    name: index.alias,
    format: "json"
  });

  const aliasExists = catAliasesResponse.body.length > 0;
  if (!aliasExists) {
    // first time indexation for a new alias name
    await initializeIndex(index, useQueue);
  } else {
    if (!!bsdTypeToIndex) {
      if (!force) {
        logger.error(
          "When you specify a bsd type to reindex, you must pass the --force argument to confirm deleting older BSDs before indexing."
        );
        return;
      }
      await reindexInPlace(index, bsdTypeToIndex, force, useQueue);
    } else {
      await reindexRollover(index, force, useQueue);
    }
  }

  logger.info(`indexElasticSearch() done, exiting.`);
}
