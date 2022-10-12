import type { ApiResponse } from "@elastic/elasticsearch";
import logger from "../../logging/logger";
import { client, indexAllBsds, BsdIndex } from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";

type IndexElasticSearchOpts = {
  index: BsdIndex;
  force?: boolean;
  useQueue?: boolean;
};

/**
 * Separators constants
 * If changed, breaks the script roll-over system
 * BETTER NOT change in production
 */
export const INDEX_ALIAS_NAME_SEPARATOR = "_";
export const INDEX_DATETIME_SEPARATOR = "===";

/**
 * Convert Date to readable index version name suffix
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
 * Create index on ES optimized for bulk indexing
 */
async function declareNewIndex(index: BsdIndex) {
  const newIndex = getIndexName(index);
  await client.indices.create({
    index: newIndex,
    body: {
      mappings: { [index.type]: index.mappings },
      settings: {
        ...index.settings,
        index: {
          ...index.settings.index,
          // optimize for speed https://www.elastic.co/guide/en/elasticsearch/reference/6.8/tune-for-indexing-speed.html
          refresh_interval: -1,
          number_of_replicas: 0
        }
      }
    },
    include_type_name: true // compatibility with ES 7+
  });
  return newIndex;
}

/**
 * Update ES dynamic index settings
 * Dynamis settings docs :https://www.elastic.co/guide/en/elasticsearch/reference/6.8/index-modules.html#dynamic-index-settings
 * Example settings for speed https://www.elastic.co/guide/en/elasticsearch/reference/6.8/tune-for-indexing-speed.html
 */
async function updateIndexSettings(
  index: string,
  settings: { settings: { index: any } }
) {
  return client.indices.putSettings({
    index,
    preserve_existing: true,
    body: settings
  });
}

/**
 * Clean older indexes and attach the newest one to the alias
 */
const attachNewIndexAndcleanOldIndexes = async (
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
          await client.indices.delete(
            {
              index
            },
            { ignore: [404] }
          );
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
    mostRecentIndexDateAndVersion.mappings_version! === index.mappings_version
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
export async function reindexPartialInPlace(
  index: BsdIndex,
  bsdType: BsdType,
  force = false,
  useQueue = false,
  since?: Date
) {
  // avoid unwanted deletion
  if (bsdType && force && !since) {
    logger.info(`Deleting ${bsdType} entries`);
    await client.deleteByQuery({
      index: index.alias,
      body: {
        query: {
          match: {
            type: bsdType
          }
        }
      }
    });
  }
  logger.info(
    `Reindex in place ${bsdType ? bsdType + " " : " "}${
      since ? "since" : ""
    } ${since}`
  );
  await indexAllBsds(index.alias, useQueue, bsdType, since);
}

/**
 * Bump a new index. During indexation, the alias still points to the old index
 * to avoid read downtimes. At the end of the indexation, the alias is reconfigured to
 * point to the new index.
 */
async function reindexAllBsdsNoDowntime(
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

    await indexAllBsds(newIndex, useQueue);
    await attachNewIndexAndcleanOldIndexes(index, newIndex);
    // restore index settings to defaults
    await updateIndexSettings(newIndex, {
      settings: {
        index: {
          refresh_interval: "1s",
          number_of_replicas: 1
        }
      }
    });
  } else {
    logger.info(
      `reindexAll script has nothing to do, no mappings changes detected nor --force argument passed`
    );
  }
}

/**
 * Creates a brand new index and alias from scratch
 */
async function initializeIndex(index: BsdIndex, useQueue = false) {
  const newIndex = await declareNewIndex(index);
  await client.indices.putAlias({
    name: index.alias,
    index: newIndex
  });
  logger.info(
    `All BSDs are being indexed in the new index "${newIndex}" with alias "${index.alias}".`
  );
  await indexAllBsds(newIndex, useQueue);
  // restore index settings to defaults
  await updateIndexSettings(newIndex, {
    settings: {
      index: {
        refresh_interval: "1s",
        number_of_replicas: 1
      }
    }
  });
  logger.info(
    `Created the alias "${index.alias}" pointing to the new index "${newIndex}"`
  );
}

/**
 * Main function
 * Initialize the first index or re-index without downtime if mapping changed
 * Re-index in place (deleting & indexing again) for a single type of BSds
 */
export async function reindexAllBsdsInBulk({
  index,
  useQueue = false,
  force = false
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
    await reindexAllBsdsNoDowntime(index, force, useQueue);
  }

  logger.info(`reindexAllBsdsInBulk() done, exiting.`);
}
