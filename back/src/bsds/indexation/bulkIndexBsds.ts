import { Job, JobOptions } from "bull";
import type { ApiResponse } from "@elastic/elasticsearch";
import logger from "../../logging/logger";
import prisma from "../../prisma";
import {
  client,
  BsdIndex,
  indexBsds,
  index as defaultIndexConfig,
  BsdElastic
} from "../../common/elastic";
import { BsdType } from "../../generated/graphql/types";
import { toBsdElastic as bsdaToBsdElastic } from "../../bsda/elastic";
import { toBsdElastic as bsdasriToBsdElastic } from "../../bsdasris/elastic";
import { toBsdElastic as bsffToBsdElastic } from "../../bsffs/elastic";
import { toBsdElastic as formToBsdElastic } from "../../forms/elastic";
import { toBsdElastic as bsvhuToBsdElastic } from "../../bsvhu/elastic";
import { indexQueue } from "../../queue/producers/elastic";
type IndexElasticSearchOpts = {
  index?: BsdIndex;
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

type IndexAllFnSignature = {
  bsdName: string;
  index: string;
  since?: Date;
};

export type FindManyAndIndexBsdsFnSignature = {
  bsdName: string;
  index: string;
  ids: string[];
};

type ToBsdElasticFunction = (bsd: any) => BsdElastic;

const bsdNameToBsdElasticFns: {
  [key: string]: ToBsdElasticFunction;
} = {
  bsff: bsffToBsdElastic,
  bsvhu: bsvhuToBsdElastic,
  bsda: bsdaToBsdElastic,
  bsdasri: bsdasriToBsdElastic,
  bsdd: formToBsdElastic
};

const prismaModels = {
  bsff: prisma.bsff,
  bsvhu: prisma.bsvhu,
  bsda: prisma.bsda,
  bsdasri: prisma.bsdasri,
  bsdd: prisma.form
};

const prismaFindManyOptions = {
  bsff: {
    include: { packagings: true, ficheInterventions: true }
  },
  bsvhu: {},
  bsda: {
    include: {
      forwardedIn: { select: { id: true } },
      groupedIn: { select: { id: true } },
      intermediaries: true
    }
  },
  bsdasri: {
    include: {
      grouping: { select: { id: true } },
      synthesizing: { select: { id: true } }
    }
  },
  bsdd: {
    include: {
      forwarding: true,
      forwardedIn: true,
      transporters: true,
      intermediaries: true
    }
  }
};

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
    .toISOString()
    .replace(/\:/g, INDEX_DATETIME_SEPARATOR)
    .toLowerCase();
};

/**
 * Convert index name to the Date object of its creation time
 */
const getIndexDateFromName = (indexName: string): Date => {
  // Datetime is the last fragment in the index name
  const indexDateString = indexName.split(INDEX_ALIAS_NAME_SEPARATOR).pop();
  if (!indexDateString) {
    throw new Error(
      `No "indexDateString" found for indexName ${indexName} and separator ${INDEX_ALIAS_NAME_SEPARATOR}`
    );
  }
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
  [
    index.alias,
    index.mappings_version,
    process.env.NODE_ENV ?? "dev",
    getIndexDateString(dateStr)
  ].join(INDEX_ALIAS_NAME_SEPARATOR);

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
    index: `${index.alias}${INDEX_ALIAS_NAME_SEPARATOR}v*`,
    format: "json"
  });

  // Indices sorted by Date of creation
  const oldIndicesToDelete = indices.body
    .map((info: { index: string }) => info.index)
    .filter((index: string) => index !== newIndex)
    .sort((a, b) => {
      if (getIndexDateFromName(a) === getIndexDateFromName(b)) {
        return 0;
      }
      if (getIndexDateFromName(a) < getIndexDateFromName(b)) {
        return -1;
      } else {
        return 1;
      }
    });

  const oldIndiceToKeep = oldIndicesToDelete.pop();
  logger.info(
    `Keeping previous index "${oldIndiceToKeep}" if a rescue rollback is needed use: curl -X PUT http://elasticsearch.url/${oldIndiceToKeep}/alias/${index.alias}`
  );
  if (oldIndicesToDelete.length) {
    logger.info(
      `Removing ${
        oldIndicesToDelete.length
      } old index : ${oldIndicesToDelete.join(",")}`
    );

    await Promise.all(
      oldIndicesToDelete.map(async index => {
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

  const everyMappingUnchanged = aliases?.body
    .map(info => info.index)
    .every(
      (name: string) =>
        getIndexMappingsVersionFromName(name) === index.mappings_version
    );

  if (everyMappingUnchanged) {
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
): Promise<string> {
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
    return newIndex;
  } else {
    logger.info(
      `reindexAll script has nothing to do, no mappings changes detected nor --force argument passed`
    );
    return index.alias;
  }
}

/**
 * Creates a brand new index and alias from scratch
 */
async function initializeIndex(
  index: BsdIndex,
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
  await indexAllBsds(newIndex, useQueue);
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
    const newIndex = await initializeIndex(index, useQueue);
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

/**
 * Main queuing function
 */
export async function addReindexAllInBulkJob(
  force: boolean
): Promise<Job<string>> {
  logger.info(
    `Enqueuing job indexAllInBulk for the indexation of all bsds in bulk without downtime`
  );
  // default options can be overwritten by the calling function
  const jobOptions: JobOptions = {
    lifo: true,
    attempts: 1,
    timeout: 36_000_000 // 10h
  };
  const job = await indexQueue.add(
    "indexAllInBulk",
    JSON.stringify({
      index: defaultIndexConfig,
      force
    }),
    jobOptions
  );
  const isActive = await job.isActive();
  logger.info(
    `Done enqueuing job indexAllInBulk: Job ${job.id}, is currently active ? ${isActive}`
  );
  return job;
}

/**
 * Retrieves all BSD identifiers for a given BSD type
 */
export async function getBsdIdentifiers(
  bsdName: string,
  since?: Date
): Promise<string[]> {
  const prismaModelDelegate = prismaModels[bsdName];

  const bsds = await prismaModelDelegate.findMany({
    where: {
      isDeleted: false,
      ...(since ? { updatedAt: { gte: since } } : {})
    },
    select: { id: true }
  });

  return bsds.map(bsd => bsd.id);
}

export async function processBsdIdentifiersByChunk(
  ids: string[],
  fn: (chunk: string[]) => Promise<any>,
  chunkSize = parseInt(process.env.BULK_INDEX_BATCH_SIZE, 10)
) {
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    await fn(chunk);
  }
}

/**
 * Index in chunks all BSDs of a given type in a synchronous manner
 */
export async function indexAllBsdTypeSync({
  bsdName,
  index,
  since
}: IndexAllFnSignature): Promise<void> {
  const ids = await getBsdIdentifiers(bsdName, since);

  logger.info(`Starting synchronous indexation of ${ids.length} ${bsdName}`);

  await processBsdIdentifiersByChunk(ids, chunk =>
    findManyAndIndexBsds({
      bsdName,
      index,
      ids: chunk
    })
  );
}

/**
 * Index in chunks all BSDs of a given type by adding jobs
 * to the job queue
 */
export async function indexAllBsdTypeConcurrently({
  bsdName,
  index,
  since
}: IndexAllFnSignature) {
  const jobs: Job<string>[] = [];

  const data: { name: string; data: string; opts?: JobOptions }[] = [];

  const ids = await getBsdIdentifiers(bsdName, since);
  logger.info(`Starting indexation of ${ids.length} ${bsdName}`);

  await processBsdIdentifiersByChunk(ids, async chunk => {
    data.push({
      name: "indexChunk",
      data: JSON.stringify({
        bsdName,
        index,
        ids: chunk
      }),
      opts: {
        lifo: true,
        stackTraceLimit: 100,
        attempts: 1,
        timeout: 600_000 // 10 min
      }
    });
  });

  // control concurrency of addBulk
  const chunkSize = parseInt(process.env.BULK_INDEX_BATCH_ADD, 10);
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    // all jobs are succesfully added in bulk or all jobs will fail
    const bulkJobs = await indexQueue.addBulk(chunk);
    jobs.push(...bulkJobs);
  }

  logger.info(
    `Added ${data.length} bulk jobs to index chunks of "${bsdName}" to index "${index}"`
  );

  if (jobs.length) {
    logger.info(`Waiting for all ${jobs.length} jobs in queue to finish`);
    // returned promise fulfills when all of the input's promises settle (resolved or rejected)
    return Promise.allSettled(
      jobs.map(job => {
        // Returns a promise that resolves or rejects when the job completes or fails.
        return job.finished();
      })
    );
  }
}

/**
 * Generic indexation function for all bsd of a given type
 */
export async function indexAllBsds(
  index: string,
  useQueue = false,
  bsdType?: BsdType,
  updatedSince?: Date
): Promise<void> {
  const startDate = new Date();

  const allBsdTypes: BsdType[] = ["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"];

  for (const loopType of allBsdTypes) {
    if (!bsdType || bsdType === loopType) {
      const bsdName = loopType.toLowerCase();

      if (!useQueue) {
        await indexAllBsdTypeSync({
          bsdName,
          index,
          since: updatedSince
        });
      } else {
        await indexAllBsdTypeConcurrently({
          bsdName,
          index,
          since: updatedSince
        });
      }
    }
  }

  logger.info(
    `Catching-up indexation of BSDs updated in database since ${startDate.toISOString()}`
  );
  for (const loopType of allBsdTypes) {
    if (!bsdType || bsdType === loopType) {
      const bsdName = loopType.toLowerCase();
      await indexAllBsdTypeSync({
        bsdName,
        index,
        since: startDate
      });
    }
  }

  logger.info("All types of BSD have been indexed");
}

/**
 * Find a slice of Bsds in the database and Bulk index them
 */
export async function findManyAndIndexBsds({
  bsdName,
  index,
  ids
}: FindManyAndIndexBsdsFnSignature): Promise<void> {
  const prismaModelDelegate = prismaModels[bsdName];
  const toBsdElasticFn = bsdNameToBsdElasticFns[bsdName];
  if (!toBsdElasticFn || !prismaModelDelegate) {
    const msg = `Wrong parameters for findManyAndIndexBsds : ${bsdName} not found`;
    logger.error(msg);
    throw new Error(msg);
  }
  const bsds = await prismaModelDelegate.findMany({
    where: { id: { in: ids } },
    ...prismaFindManyOptions[bsdName]
  });

  await indexBsds(
    index,
    bsds.map(bsd => toBsdElasticFn(bsd))
  );

  logger.info(`Indexed ${bsdName} batch of ${bsds.length}`);
}
