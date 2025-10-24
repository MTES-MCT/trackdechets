import { redisClient, esClient, esIndex, indexQueue } from "back";
import { prisma } from "@td/prisma";

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
    await prisma.$queryRaw`SELECT tablename::text as tablename FROM pg_tables WHERE schemaname=${dbSchemaName};`;

  // Reset data
  await Promise.all(
    tablenames.map(({ tablename }) =>
      prisma.$executeRawUnsafe(
        `ALTER TABLE "${dbSchemaName}"."${tablename}" DISABLE TRIGGER ALL;`
      )
    )
  );
  await Promise.all(
    tablenames.map(({ tablename }) =>
      prisma.$executeRawUnsafe(`DELETE FROM "${dbSchemaName}"."${tablename}";`)
    )
  );
  await Promise.all(
    tablenames.map(({ tablename }) =>
      prisma.$executeRawUnsafe(
        `ALTER TABLE "${dbSchemaName}"."${tablename}" ENABLE TRIGGER ALL;`
      )
    )
  );

  // Reset sequences
  await prisma.$executeRawUnsafe(`
      SELECT SETVAL(c.oid, 1)
      from pg_class c JOIN pg_namespace n 
      on n.oid = c.relnamespace 
      where c.relkind = 'S' and n.nspname = '${dbSchemaName}';
    `);
}

export async function resetDatabase() {
  await refreshElasticSearch();
  await esClient.deleteByQuery(
    {
      index: esIndex.alias,
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

export async function refreshElasticSearch(timeout = 1000) {
  const drainedPromise = new Promise<void>(resolve =>
    indexQueue.once("global:drained", resolve)
  );

  // Wait for the processing queue to index all bsds
  const jobsCount = await indexQueue.getJobCounts();
  if (jobsCount.active || jobsCount.waiting || jobsCount.delayed) {
    await Promise.race([
      drainedPromise,
      new Promise(resolve => setTimeout(resolve, timeout))
    ]);
  }
  indexQueue.removeAllListeners("global:drained");

  return esClient.indices.refresh(
    {
      index: esIndex.alias
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

export const clearData = async () => {
  await resetDatabase();
  await resetCache();
};
