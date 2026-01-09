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
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { ElasticsearchInstrumentation } from "opentelemetry-instrumentation-elasticsearch";
import { getAppRootFolderName } from "./utils";
import { initializeNodeRuntimeMetrics } from "./metric";

// Incubating attributes
const ATTR_CLOUD_REGION = "cloud.region";
const ATTR_CONTAINER_NAME = "container.name";
const ATTR_DEPLOYMENT_ENVIRONMENT = "deployment.environment";

if (process.env.NODE_ENV !== "test" && !process.env.OTEL_SDK_DISABLED) {
  const serviceName = getAppRootFolderName();

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName || "trackdechets",
      [ATTR_SERVICE_VERSION]: "1.0.0",
      [ATTR_DEPLOYMENT_ENVIRONMENT]:
        process.env.OTEL_ENVIRONMENT || "development",
      [ATTR_CLOUD_REGION]: process.env.REGION_NAME,
      [ATTR_CONTAINER_NAME]: process.env.HOSTNAME
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
      new FsInstrumentation({
        requireParentSpan: true // only instrument fs if it is part of another trace
      }),
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

    const cleanupRuntimeMetrics = initializeNodeRuntimeMetrics();

    process.on("SIGTERM", () => {
      cleanupRuntimeMetrics();
      sdk.shutdown();
    });
  } catch (error) {
    console.error(
      "Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry",
      error
    );
  }
}
