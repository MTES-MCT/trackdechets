import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME
} from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { logger } from "@td/logger";
import { enableEventLoopMonitor } from "./eventLoop";
import { findPkg } from "./pkg";

import { DataloaderInstrumentation } from "@opentelemetry/instrumentation-dataloader";
import { DnsInstrumentation } from "@opentelemetry/instrumentation-dns";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { FsInstrumentation } from "@opentelemetry/instrumentation-fs";
import { GraphQLInstrumentation } from "@opentelemetry/instrumentation-graphql";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";
import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";

if (process.env.NODE_ENV !== "test" && process.env.OTEL_ENABLED === "true") {
  const packageJson = findPkg();

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: packageJson.name || "trackdechets",
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV
    }),
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter()
    }),
    instrumentations: [
      new DataloaderInstrumentation(),
      new DnsInstrumentation(),
      new ExpressInstrumentation(),
      new FsInstrumentation(),
      new GraphQLInstrumentation(),
      new HttpInstrumentation(),
      new IORedisInstrumentation(),
      new MongoDBInstrumentation(),
      new WinstonInstrumentation(),
      new PrismaInstrumentation()
    ]
  });

  try {
    sdk.start();
    console.info("Telemetry started");
  } catch (error) {
    logger.error(
      "Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry",
      error
    );
  }

  enableEventLoopMonitor();

  process.on("SIGTERM", () => {
    sdk.shutdown();
  });
}
