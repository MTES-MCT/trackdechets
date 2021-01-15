import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { app } from "../src/server";

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

  return new Promise(resolve => {
    httpServerInstance.close(() => {
      httpServerInstance = null;
      resolve();
    });
  });
}

export async function resetDatabase() {
  // We need a longer than 5sec timeout...
  jest.setTimeout(10000);

  await prisma.$executeRaw("SELECT truncate_tables();");
}

/**
 * Reset redis cache
 */
export function resetCache() {
  return redisClient.flushdb();
}
