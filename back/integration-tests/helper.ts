import { exec } from "child_process";
import { promisify } from "util";
import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { app } from "../src/server";
import { redis } from "../src/common/redis";

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

  await promisify(exec)("prisma reset --force");
}

/**
 * Reset redis cache
 */
export function resetCache() {
  return redis.flushdb();
}
