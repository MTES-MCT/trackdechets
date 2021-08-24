import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { app } from "../src/server";
import { client as elasticSearch, index } from "../src/common/elastic";

let httpServerInstance: HttpServer | HttpsServer = null;

export function startServer() {
  if (!httpServerInstance) {
    httpServerInstance = app.listen(process.env.BACK_PORT);
  }
  return httpServerInstance;
}

export async function closeServer() {
  if (!httpServerInstance) {
    return Promise.resolve();
  }

  return new Promise<void>(resolve => {
    httpServerInstance.close(() => {
      httpServerInstance = null;
      resolve();
    });
  });
}

export async function resetDatabase() {
  // We need a longer than 5sec timeout...
  jest.setTimeout(10000);

  await refreshElasticSearch();
  await elasticSearch.deleteByQuery({
    index: index.alias,
    body: {
      query: {
        match_all: {}
      }
    },
    refresh: true
  });
  await prisma.$executeRaw("SELECT truncate_tables();");
}

export function refreshElasticSearch() {
  return elasticSearch.indices.refresh({
    index: index.alias
  });
}

/**
 * Reset redis cache
 */
export function resetCache() {
  return redisClient.flushdb();
}

afterAll(async () => {
  jest.restoreAllMocks();
  await elasticSearch.close();
  await redisClient.quit();
  await prisma.$disconnect();
});
