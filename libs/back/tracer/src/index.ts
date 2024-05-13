import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { DataloaderInstrumentation } from "@opentelemetry/instrumentation-dataloader";
import { DnsInstrumentation } from "@opentelemetry/instrumentation-dns";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { FsInstrumentation } from "@opentelemetry/instrumentation-fs";
import { GraphQLInstrumentation } from "@opentelemetry/instrumentation-graphql";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";
import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { Resource } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  SEMRESATTRS_CLOUD_REGION,
  SEMRESATTRS_CONTAINER_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME
} from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { ElasticsearchInstrumentation } from "opentelemetry-instrumentation-elasticsearch";
import { findPkg } from "./pkg";

if (process.env.NODE_ENV !== "test" && !process.env.OTEL_SDK_DISABLED) {
  const packageJson = findPkg();

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: packageJson.name || "trackdechets",
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]:
        process.env.OTEL_ENVIRONMENT || "development",
      [SEMRESATTRS_CLOUD_REGION]: process.env.REGION_NAME,
      [SEMRESATTRS_CONTAINER_NAME]: process.env.APP
    }),
    logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter()),
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter()
    }),
    instrumentations: [
      new DataloaderInstrumentation(),
      new DnsInstrumentation(),
      new ExpressInstrumentation(),
      new FsInstrumentation(),
      new GraphQLInstrumentation({
        mergeItems: true,
        ignoreTrivialResolveSpans: true,
        ignoreResolveSpans: true
      }),
      new HttpInstrumentation(),
      new IORedisInstrumentation(),
      new MongoDBInstrumentation(),
      new WinstonInstrumentation(),
      new PrismaInstrumentation(),
      new ElasticsearchInstrumentation()
    ]
  });

  try {
    sdk.start();
    console.info("Telemetry started");
  } catch (error) {
    console.error(
      "Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry",
      error
    );
  }

  process.on("SIGTERM", () => {
    sdk.shutdown();
  });
}
