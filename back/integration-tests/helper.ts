import { exec } from "child_process";
import { promisify } from "util";
import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { graphql } from "graphql";
import { ExecutionResultDataDefault } from "graphql/execution/execute";
import { prisma } from "../src/generated/prisma-client";
import { server } from "../src/server";

export async function execute<TData = ExecutionResultDataDefault>(
  query: string,
  context = { prisma },
  variables = {}
) {
  const schema = server.executableSchema;
  return graphql<TData>(schema, query, null, context, variables);
}

let httpServerInfos: {
  isRunning: boolean;
  instancePromise: Promise<HttpServer | HttpsServer>;
} = {
  isRunning: false,
  instancePromise: null
};

export function startServer() {
  if (!httpServerInfos.isRunning) {
    httpServerInfos.isRunning = true;
    httpServerInfos.instancePromise = server.start();
  }
  return httpServerInfos.instancePromise;
}

export async function closeServer() {
  if (!httpServerInfos.isRunning) {
    return Promise.resolve();
  }

  const instance = await httpServerInfos.instancePromise;
  return new Promise(resolve => {
    instance.close(() => {
      httpServerInfos.isRunning = false;
      resolve();
    });
  });
}

export async function resetDatabase() {
  // We need a longer than 5sec timeout...
  jest.setTimeout(10000);

  await promisify(exec)("cd ../prisma && prisma seed -r");
}
