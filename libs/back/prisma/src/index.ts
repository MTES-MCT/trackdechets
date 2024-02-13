import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import {
  BasicTracerProvider,
  BatchSpanProcessor
} from "@opentelemetry/sdk-trace-base";
import { PrismaClient } from "@prisma/client";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { unescape } from "node:querystring";
import { URL } from "node:url";
import { DatadogContextManager } from "./logging/contextManager";
import { collectMetrics } from "./metrics";

const { DATABASE_URL, NODE_ENV, DD_TRACE_ENABLED } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(DATABASE_URL) }
  },
  log: process.env.NODE_ENV !== "test" ? ["info", "warn", "error"] : []
});

if (NODE_ENV === "production") {
  collectMetrics(prisma);
}

if (DD_TRACE_ENABLED !== "false") {
  const provider = new BasicTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "prisma"
    })
  });
  provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter()));
  provider.register({
    contextManager: new DatadogContextManager()
  });

  new PrismaInstrumentation().enable();
}

function getDbUrlWithSchema(rawDatabaseUrl: string) {
  try {
    const dbUrl = new URL(rawDatabaseUrl);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}
