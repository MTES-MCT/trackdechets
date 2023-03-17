import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { app } from "../src/server";
import { client as elasticSearch, index } from "../src/common/elastic";
import { indexQueue } from "../src/queue/producers/elastic";

let httpServerInstance: HttpServer | HttpsServer | null = null;

export function startServer() {
  if (!httpServerInstance) {
    httpServerInstance = app.listen(process.env.BACK_PORT);
  }
  return httpServerInstance;
}

export async function closeServer() {
  return new Promise<void>(resolve => {
    if (!httpServerInstance) {
      return resolve();
    }

    httpServerInstance.close(() => {
      httpServerInstance = null;
      resolve();
    });
  });
}

/**
 * Special fast path to drop data from a postgres database.
 * Taken from https://github.com/prisma/prisma/issues/742#issuecomment-776901281
 * This is an optimization which is particularly crucial in a unit testing context.
 * This code path takes milliseconds, vs ~7 seconds for a migrate reset + db push
 *
 **/
export async function truncateDatabase() {
  const dbSchemaName = "default$default";
  const tables: Array<{ tablename: string }> =
    await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname=${dbSchemaName};`;

  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE \"${dbSchemaName}\".\"${tablename}\" CASCADE;`
    );
  }
  const sequences: Array<{ relname: string }> =
    await prisma.$queryRaw`SELECT c.relname FROM pg_class AS c JOIN pg_namespace AS n ON c.relnamespace = n.oid WHERE c.relkind='S' AND n.nspname=${dbSchemaName};`;

  for (const { relname } of sequences) {
    await prisma.$queryRaw`ALTER SEQUENCE \"${dbSchemaName}\".\"${relname}\" RESTART WITH 1;`;
  }
}

export async function resetDatabase() {
  // We need a longer than 5sec timeout...
  jest.setTimeout(10000);

  await refreshElasticSearch();
  await elasticSearch.deleteByQuery(
    {
      index: index.alias,
      body: {
        query: {
          match_all: {}
        }
      },
      refresh: true
    },
    {
      // do not throw an error if a document has been updated during delete operation
      ignore: [409]
    }
  );
  await truncateDatabase();
}

export async function refreshElasticSearch() {
  const drainedPromise = new Promise<void>(resolve =>
    indexQueue.once("global:drained", resolve)
  );

  // Wait for the processing queue to index all bsds
  const jobsCount = await indexQueue.getJobCounts();
  if (jobsCount.active || jobsCount.waiting || jobsCount.delayed) {
    await Promise.race([
      drainedPromise,
      new Promise(resolve => setTimeout(resolve, 1000))
    ]);
  }
  indexQueue.removeAllListeners("global:drained");

  return elasticSearch.indices.refresh(
    {
      index: index.alias
    },
    {
      // do not throw an error on version conflicts
      ignore: [409]
    }
  );
}

/**
 * Reset redis cache
 */
export function resetCache() {
  return redisClient.flushdb();
}
