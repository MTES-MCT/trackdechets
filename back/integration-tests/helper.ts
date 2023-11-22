import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { client as elasticSearch, index } from "../src/common/elastic";
import { indexQueue } from "../src/queue/producers/elastic";
import { closeMongoClient } from "../src/events/mongodb";
import { closeQueues } from "../src/queue/producers";
import { server, startApolloServer } from "../src/server";

beforeAll(async () => {
  await startApolloServer();
});

afterAll(async () => {
  await Promise.all([
    closeMongoClient(),
    closeQueues(),
    elasticSearch.close(),
    redisClient.disconnect(),
    prisma.$disconnect(),
    server.stop()
  ]);
});

/**
 * Special fast path to drop data from a postgres database.
 * Taken from https://github.com/prisma/prisma/issues/742#issuecomment-776901281
 * This is an optimization which is particularly crucial in a unit testing context.
 * This code path takes milliseconds, vs ~7 seconds for a migrate reset + db push
 *
 **/
export async function truncateDatabase() {
  const dbSchemaName = "default$default";
  const tablenames: Array<{ tablename: string }> =
    await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname=${dbSchemaName};`;

  const tables = tablenames
    .map(({ tablename }) => `"${dbSchemaName}"."${tablename}"`)
    .join(", ");

  return Promise.all([
    // Reset data
    prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`),
    // Reset sequences
    prisma.$executeRawUnsafe(`
      SELECT SETVAL(c.oid, 1)
      from pg_class c JOIN pg_namespace n 
      on n.oid = c.relnamespace 
      where c.relkind = 'S' and n.nspname = '${dbSchemaName}';
    `)
  ]);
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
