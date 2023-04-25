import fs from "fs";
import { rm } from "fs/promises";
import https from "https";
import path from "path";
import stream, { Writable } from "stream";
import util from "util";
import {
  BulkOperationContainer,
  BulkOperationType,
  BulkResponse
} from "@elastic/elasticsearch/api/types";
import { ApiResponse } from "@elastic/elasticsearch";
import { parse } from "fast-csv";
import StreamZip from "node-stream-zip";
import { logger } from "..";
import { elasticSearchClient as client } from "..";
import {
  ElasticBulkIndexError,
  ElasticBulkNonFlatPayload,
  ElasticBulkNonFlatPayloadWithNull,
  IndexProcessConfig,
} from "./types";
import { INDEX_ALIAS_NAME_SEPARATOR } from "./indexInsee.helpers";

const pipeline = util.promisify(stream.pipeline);
var pjson = require("../../../package.json");

// Max size of documents to bulk index, depends on ES JVM memory available
const CHUNK_SIZE: number = parseInt(`${process.env.INDEX_CHUNK_SIZE}`, 10) || 10_000;

/**
 * Common index name formatter
 */
export const getIndexVersionName = (indexConfig: IndexProcessConfig) =>
  `${indexConfig.alias}${INDEX_ALIAS_NAME_SEPARATOR}${
    pjson.version
  }${INDEX_ALIAS_NAME_SEPARATOR}${Date.now()}`;

/**
 * Create a new index with timestamp appended to the alias name
 * overrides the index alias with a timestamp in order to handle roll-over indices
 */
export const createIndexRelease = async (
  indexConfig: IndexProcessConfig
): Promise<string> => {
  const indexName = getIndexVersionName(indexConfig);
  const { mappings, settings } = indexConfig;
  await client.indices.create({
    index: indexName,
    body: {
      ...(mappings && { mappings }),
      ...(settings && { settings })
    },
    include_type_name: true // Compatibility for v7+ with _doc types
  });
  logger.info(`Created a new index ${indexName}`);
  return indexName;
};

/**
 * Clean older indexes and attach the newest one to the alias
 */
export const cleanOldIndexes = async (
  indexAlias: string,
  indexName: string
) => {
  const aliases = await client.cat.aliases({
    name: indexAlias,
    format: "json"
  });
  const bindedIndexes = aliases.body.map((info: { index: any }) => info.index);
  logger.info(
    `Pointing the index alias ${indexAlias} to the index ${indexName}.`
  );
  client.indices.updateAliases({
    body: {
      actions : [
          ...(bindedIndexes.length ? [{ remove : { indices: bindedIndexes, alias: indexAlias } }] : []),
          { add : { index: indexName, alias: indexAlias } }
      ]
  }
  });
  if (bindedIndexes.length) {
    logger.info(
      `Removed alias pointers to older indices ${bindedIndexes.join(", ")}.`
    );
  }
  // Delete old indices to save disk space, except the last
  const indices = await client.cat.indices({
    index: `${indexAlias}${INDEX_ALIAS_NAME_SEPARATOR}${pjson.version}${INDEX_ALIAS_NAME_SEPARATOR}*`,
    format: "json"
  });
  const oldIndices: string[] = indices.body
    .map((info: { index: string }) => info.index)
    // Filter out the last indexName
    .filter((name: string) => name !== indexName)
    .sort();
  // keep the last index in order to rollback if needed
  oldIndices.pop();
  if (oldIndices.length) {
    logger.info(
      `Removing ${oldIndices.length} old index(es) (${oldIndices.join(", ")})`
    );
    await client.indices.delete({ index: oldIndices.join(",") });
  }
};

/**
 * Bulk Index and collect errors
 * controls the maximum chunk size because unzip does not
 */
export const bulkIndex = async (
  body: ElasticBulkNonFlatPayload,
  indexConfig: IndexProcessConfig,
  indexName: string
) => {
  /**
   * Chunk and loop on bulkIndex
   */
  const request = async (bodyChunk: ElasticBulkNonFlatPayload) => {
    /**
     * Calls client.bulk
     */
    const requestBulkIndex = async (body: BulkOperationContainer[]) => {
      if (!body || !body.length) {
        // nothing to index
        return Promise.resolve(null);
      }
      const bulkResponse: ApiResponse<BulkResponse> = await client.bulk({
        body,
        // lighten the response
        _source_excludes: ["items.index._*", "took"]
      });
      // Log error data and continue
      if (bulkResponse) {
        await logBulkErrorsAndRetry(bulkResponse.body, body);
      }
    };
    if (bodyChunk.length) {
      logger.info(
        `Indexing ${bodyChunk.length} documents in bulk to index ${indexName}`
      );
    }
    // append new data to the body before indexation
    if (typeof indexConfig.dataFormatterFn === "function") {
      const formattedChunk = await indexConfig.dataFormatterFn(bodyChunk, indexConfig.dataFormatterExtras);
      return requestBulkIndex(formattedChunk.flat() as BulkOperationContainer[]);
    }
    return requestBulkIndex(bodyChunk.flat() as BulkOperationContainer[]);
  };

  /**
   * Log bulkIndex errors and retries in some cases
   */
  const logBulkErrorsAndRetry = async (
    bulkResponse: BulkResponse,
    body: BulkOperationContainer[]
  ) => {
    if (bulkResponse.errors) {
      for (let k = 0; k < bulkResponse.items.length; k++) {
        const action = bulkResponse.items[k]!;
        const operations: string[] = Object.keys(action);
        for (const operation of operations) {
          const opType = operation as BulkOperationType;
          if (opType && action[opType]?.error) {
            // If the status is 429 it means that we can retry the document
            if (action[opType]?.status === 429) {
              logger.warn(
                `Retrying index operation for doc ${
                  body[k * 2].index?._id
                } in index ${indexName}`
              );
              try {
                await client.index({
                  index: indexName,
                  id: body[k * 2].index?._id as string,
                  body: body[k * 2 + 1],
                  type: "_doc",
                  refresh: false
                });
              } catch (err) {
                logger.error(
                  `Error retrying index operation for doc ${
                    body[k * 2].index?._id
                  } in index ${indexName}`,
                  err
                );
              }
            }
            // otherwise it's very likely a mapping error, and you should fix the document content
            const elasticBulkIndexError: ElasticBulkIndexError = {
              status: action[opType]?.status!,
              error: action[opType]?.error,
              body: body[k * 2 + 1]
            };
            logger.error(`Error in bulkIndex operation`, {
              elasticBulkIndexError
            });
          }
        }
      }
    }
  };

  // immediat return the chunk larger than the data streamed
  if (CHUNK_SIZE > body.length) {
    await request(body);
    return;
  }

  // loop over other chunks
  for (let i = 0; i < body.length; i += CHUNK_SIZE) {
    const end = i + CHUNK_SIZE;
    const slice = body.slice(i, end);
    await request(slice);
  }
};

/**
 * Writable stream that parses CSV to an ES bulk body
 */
export const getWritableParserAndIndexer = (
  indexConfig: IndexProcessConfig,
  indexName: string
) =>
  new Writable({
    // seems a reasonable data size to go with CHUNK_SIZE = 10000
    highWaterMark: 100_000,
    objectMode: true,
    writev: (csvLines, next) => {
      const body: ElasticBulkNonFlatPayloadWithNull = csvLines.map((chunk, i)  => {
        const doc = chunk.chunk;
        // skip lines without "idKey" column because we cannot miss the _id in ES
        if (
          doc[indexConfig.idKey] === undefined ||
          !doc[indexConfig.idKey].length
        ) {
          logger.error(
            `skipping malformed csv line ${i} missing _id key ${indexConfig.idKey}`,
            doc
          );
          return null;
        } else if (doc[indexConfig.idKey] === indexConfig.idKey) {
          // first line
          return null;
        } else {
          return [
            {
              index: {
                _id: doc[indexConfig.idKey],
                _index: indexName,
                // Next major ES version won't need _type anymore
                _type: "_doc"
              }
            },
            doc
          ];
        }
      });

      bulkIndex(
        body.filter(line => line !== null) as ElasticBulkNonFlatPayload,
        indexConfig,
        indexName
      )
        .then(() => next())
        .catch(err => next(err));
    }
  });

/**
 * Streaming unzip, formatting documents and index them
 */
export const unzipAndIndex = async (
  zipPath: string,
  destination: string,
  indexConfig: IndexProcessConfig
): Promise<string> => {
  const indexName = await createIndexRelease(indexConfig);
  const zip = new StreamZip.async({ file: zipPath });
  const csvPath = path.join(destination, indexConfig.csvFileName);
  await zip.extract(indexConfig.csvFileName, csvPath);
  await zip.close();
  const headers = indexConfig.headers;
  const writableStream = getWritableParserAndIndexer(indexConfig, indexName);
  // stop after MAX_ROWS
  const maxRows = parseInt(process.env.MAX_ROWS as string, 10);
  await pipeline(
    fs.createReadStream(csvPath),
    parse({
      headers,
      ignoreEmpty: true,
      discardUnmappedColumns: true,
      ...(maxRows && { maxRows })
    })
      .on("error", error => {
        throw error;
      })
      .on("end", async (rowCount: number) => {
        logger.info(`Finished parsing ${rowCount} CSV rows`);
      }),
    writableStream
  );
  // roll-over index alias
  await cleanOldIndexes(indexConfig.alias, indexName);
  logger.info(`Finished indexing ${indexName} with alias ${indexConfig.alias}`);
  return csvPath;
};

/**
 * Download and launch indexation
 */
export const downloadAndIndex = async (
  url: string,
  indexConfig: IndexProcessConfig
) => {
  // path ../../csv* is in .gitignore or override with INSEE_DOWNLOAD_DIRECTORY
  const destination = fs.mkdtempSync(
    process.env.INSEE_DOWNLOAD_DIRECTORY ||
      path.join(__dirname, "..", "..", "csv")
  );

  const zipPath = path.join(destination, indexConfig.zipFileName);
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        const contentLength = parseInt(res.headers["content-length"] as string, 10);
        logger.info(
          `Start downloading the INSEE archive of ${
            contentLength / 1000000
          } MB from ${url} to ${zipPath}`
        );
        const interval = setInterval(
          () =>
            logger.info(
              `Downloading the INSEE archive : ${currentLength / 1000000} MB`
            ),
          5000
        );
        // Bytes progess var
        let currentLength = 0;
        const file = fs.createWriteStream(zipPath);
        // monitor progress
        res.on("data", chunk => {
          currentLength += Buffer.byteLength(chunk);
        });
        // stream into the file
        res.pipe(file);
        // Close the file
        file.on("finish", async () => {
          clearInterval(interval);
          file.close();
          logger.info(`Finished downloading the INSEE archive to ${zipPath}`);
          try {
            const csvPath = await unzipAndIndex(
              zipPath,
              destination,
              indexConfig
            );
            await rm(zipPath, { force: true });
            await rm(csvPath, { force: true });
            resolve(true);
          } catch (e: any) {
            reject(e.message);
          }
        });
      })
      .on("error", err => {
        logger.info("HTTP download Error: ", err.message);
        reject(err.message);
      });
  });
};
