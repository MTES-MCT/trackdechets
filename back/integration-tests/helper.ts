import { exec } from "child_process";
import { promisify } from "util";
import { graphql } from "graphql";
import { ExecutionResultDataDefault } from "graphql/execution/execute";
import { prisma } from "../src/generated/prisma-client";
import { server } from "../src/server";
import { httpServer } from "../src";

export async function execute<TData = ExecutionResultDataDefault>(
  query: string,
  context = { prisma },
  variables = {}
) {
  const schema = server.executableSchema;
  return graphql<TData>(schema, query, null, context, variables);
}

export async function closeServer() {
  const s = await httpServer;
  return new Promise(resolve => {
    s.close(() => {
      console.info("Server closed.");
      resolve();
    });
  });
}

export async function resetDatabase() {
  // We need a longer than 5sec timeout...
  jest.setTimeout(10000);

  await promisify(exec)("cd ../prisma && prisma seed -r");
}
