import { Job, JobOptions } from "bull";
import type { ApiResponse } from "@elastic/elasticsearch";
import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import {
  client,
  BsdIndexationConfig,
  indexBsds,
  BsdElastic
} from "../../common/elastic";
import type { BsdType } from "@td/codegen-back";
import {
  BsdaForElasticInclude,
  toBsdElastic as bsdaToBsdElastic
} from "../../bsda/elastic";
import {
  BsdasriForElasticInclude,
  toBsdElastic as bsdasriToBsdElastic
} from "../../bsdasris/elastic";
import {
  BsffForElasticInclude,
  toBsdElastic as bsffToBsdElastic
} from "../../bsffs/elastic";
import {
  FormForElasticInclude,
  toBsdElastic as formToBsdElastic
} from "../../forms/elastic";
import {
  BsvhuForElasticInclude,
  toBsdElastic as bsvhuToBsdElastic
} from "../../bsvhu/elastic";
import {
  BspaohForElasticInclude,
  toBsdElastic as bspaohToBsdElastic
} from "../../bspaoh/elastic";
import { bulkIndexQueue } from "../../queue/producers/elastic";
import { IndexAllFnSignature, FindManyAndIndexBsdsFnSignature } from "./types";

/**
 * Separators constants
 * If changed, breaks the script roll-over system
 * BETTER NOT change in production
 */
export const INDEX_ALIAS_NAME_SEPARATOR = "_";
export const INDEX_DATETIME_SEPARATOR = "===";

type ToBsdElasticFunction = (bsd: any) => BsdElastic;

const bsdNameToBsdElasticFns: {
  [key: string]: ToBsdElasticFunction;
} = {
  bsff: bsffToBsdElastic,
  bsvhu: bsvhuToBsdElastic,
  bsda: bsdaToBsdElastic,
  bsdasri: bsdasriToBsdElastic,
  bsdd: formToBsdElastic,
  bspaoh: bspaohToBsdElastic
};

const prismaModels = {
  bsff: prisma.bsff,
  bsvhu: prisma.bsvhu,
  bsda: prisma.bsda,
  bsdasri: prisma.bsdasri,
  bsdd: prisma.form,
  bspaoh: prisma.bspaoh
};

const prismaFindManyOptions = {
  bsff: {
    include: BsffForElasticInclude
  },
  bsvhu: {
    include: BsvhuForElasticInclude
  },
  bsda: {
    include: BsdaForElasticInclude
  },
  bsdasri: {
    include: BsdasriForElasticInclude
  },
  bsdd: {
    include: FormForElasticInclude
  },
  bspaoh: {
    include: BspaohForElasticInclude
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
    .replace(/:/g, INDEX_DATETIME_SEPARATOR)
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
const getIndexName = (index: BsdIndexationConfig, dateStr?: string): string =>
  [
    index.alias,
    index.mappings_version,
    process.env.NODE_ENV ?? "dev",
    getIndexDateString(dateStr)
  ].join(INDEX_ALIAS_NAME_SEPARATOR);

/**
 * Create index on ES optimized for bulk indexing
 */
export async function declareNewIndex(index: BsdIndexationConfig) {
  const newIndex = getIndexName(index);
  await client.indices.create({
    index: newIndex,
    body: {
      mappings: index.mappings,
      settings: {
        ...index.settings,
        index: {
          ...index.settings.index,
          // optimize for speed https://www.elastic.co/guide/en/elasticsearch/reference/6.8/tune-for-indexing-speed.html
          refresh_interval: -1,
          number_of_replicas: 0
        }
      }
    }
  });
  return newIndex;
}

/**
 * Clean older indexes and attach the newest one to the alias
 */
export const attachNewIndexAndcleanOldIndexes = async (
  index: BsdIndexationConfig,
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
export async function isIndexMappingsVersionChanged(
  index: BsdIndexationConfig
): Promise<boolean> {
  const aliases: ApiResponse<Array<{ index: string }>> =
    await client.cat.aliases({
      name: index.alias,
      format: "json"
    });

  if (!aliases?.body.length) {
    logger.warn(`No aliases found during mapping change detection`);
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

type GetBsdIdentifiersOpt = {
  since?: Date;
  paginateBy?: number;
};

/**
 * Retrieves all BSD identifiers for a given BSD type
 */
export async function getBsdIdentifiers(
  bsdName: string,
  { since, paginateBy }: GetBsdIdentifiersOpt = {}
): Promise<string[]> {
  const prismaModelDelegate = prismaModels[bsdName];

  const defaultPaginateBy = 500000;
  const take = paginateBy ?? defaultPaginateBy;

  // Renvoie <take> bordereaux après le bordereau
  // identifié par son curseur
  async function nextPage(after: string | null) {
    const bsds = await prismaModelDelegate.findMany({
      take,
      ...(after
        ? {
            // Cf https://www.prisma.io/docs/orm/prisma-client/queries/pagination#cursor-based-pagination
            skip: 1,
            cursor: {
              rowNumber: after
            }
          }
        : {}),
      where: {
        isDeleted: false,
        ...(since ? { updatedAt: { gte: since } } : {})
      },
      select: { id: true, rowNumber: true },
      orderBy: { rowNumber: "asc" }
    });

    return bsds;
  }

  // Récupère tous les identifiants en paginant la liste des bordereaux
  // de manière récursive grâce à une pagination par curseur qui utilise `rowNumber`
  async function paginate(after: string | null = null, ids: string[] = []) {
    const bsds = await nextPage(after);
    const length = bsds.length;
    if (length === 0) {
      return ids;
    } else {
      const bsdIds = bsds.map(bsd => bsd.id) as string[];
      const nextCursor = bsds[length - 1].rowNumber;
      return paginate(nextCursor, [...ids, ...bsdIds]);
    }
  }

  return paginate();
}

export async function processDbIdentifiersByChunk(
  ids: string[],
  fn: (chunk: string[]) => Promise<void>,
  chunkSize = parseInt(process.env.BULK_INDEX_BATCH_SIZE, 10) || 100
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
  since,
  indexConfig
}: IndexAllFnSignature): Promise<void> {
  const ids = await getBsdIdentifiers(bsdName, { since });

  logger.info(`Starting synchronous indexation of ${ids.length} ${bsdName}`);

  await processDbIdentifiersByChunk(ids, chunk =>
    findManyAndIndexBsds({
      bsdName,
      index,
      ids: chunk,
      elasticSearchUrl: indexConfig.elasticSearchUrl
    })
  );
}

/**
 * Index in chunks all BSDs of a given type by adding jobs
 * to the job queue
 */
export async function indexAllBsdTypeConcurrentJobs({
  bsdName,
  index,
  since,
  indexConfig
}: IndexAllFnSignature) {
  const jobs: Job<string>[] = [];
  const data: { name: string; data: string; opts?: JobOptions }[] = [];
  const ids = await getBsdIdentifiers(bsdName, { since });
  logger.info(`Starting indexation of ${ids.length} ${bsdName}`);

  // Prepare Job data payload to call indexQueue.addBulk
  await processDbIdentifiersByChunk(ids, async chunk => {
    data.push({
      name: "indexChunk",
      data: JSON.stringify({
        bsdName,
        index,
        ids: chunk,
        elasticSearchUrl: indexConfig.elasticSearchUrl
      })
    });
  });

  // control concurrency of addBulk
  const chunkSize = parseInt(process.env.BULK_INDEX_BATCH_ADD, 10) || 5;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    // all jobs are succesfully added in bulk or all jobs will fail
    const bulkJobs = await bulkIndexQueue.addBulk(chunk);
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
  indexConfig: BsdIndexationConfig,
  useQueue = false,
  bsdType?: BsdType,
  updatedSince?: Date
): Promise<void> {
  const startDate = new Date();

  const allBsdTypes: BsdType[] = [
    "BSDD",
    "BSDA",
    "BSDASRI",
    "BSVHU",
    "BSFF",
    "BSPAOH"
  ];

  for (const loopType of allBsdTypes) {
    if (!bsdType || bsdType === loopType) {
      const bsdName = loopType.toLowerCase();

      if (!useQueue) {
        await indexAllBsdTypeSync({
          bsdName,
          index,
          since: updatedSince,
          indexConfig
        });
      } else {
        await indexAllBsdTypeConcurrentJobs({
          bsdName,
          index,
          since: updatedSince,
          indexConfig
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
        since: startDate,
        indexConfig
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
  ids,
  elasticSearchUrl
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
    bsds.map(bsd => toBsdElasticFn(bsd)),
    elasticSearchUrl
  );

  logger.info(
    `Indexed ${bsdName} batch of ${bsds.length} to ${elasticSearchUrl}`
  );
}
