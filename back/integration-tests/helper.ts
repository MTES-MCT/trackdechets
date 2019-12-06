import { server, httpServer } from "../src/index";
import { graphql } from "graphql";
import { ExecutionResultDataDefault } from "graphql/execution/execute";
import { prisma } from "../src/generated/prisma-client";

export async function execute<TData = ExecutionResultDataDefault>(
  query: string,
  context = { prisma },
  variables = {}
) {
  await httpServer;

  const schema = server.executableSchema;
  return graphql<TData>(schema, query, null, context, variables);
}

export async function closeServer(done) {
  const s = await httpServer;
  s.close(done);
}
