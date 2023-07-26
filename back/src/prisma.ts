import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import * as ddMetrics from "datadog-metrics";
import { unescape } from "querystring";
import { URL } from "url";
import { DatadogContextManager } from "./tracer";

const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrl() }
  },
  log: process.env.NODE_ENV !== "test" ? ["info", "warn", "error"] : []
});

function getDbUrl() {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}

if (process.env.NODE_ENV === "production") {
  collectTraces();
  collectMetrics();
}

function collectMetrics() {
  if (!process.env.DD_API_KEY) return;

  const flushIntervalSeconds = 15;
  const refreshRate = 1000 * flushIntervalSeconds;

  ddMetrics.init({
    host: process.env.API_HOST,
    site: process.env.DD_SITE,
    apiKey: process.env.DD_API_KEY,
    flushIntervalSeconds: 15,
    defaultTags: [
      `env:${process.env.NODE_ENV}`,
      `container:${process.env.CONTAINER}`
    ]
  });

  let previousHistograms: Prisma.Metric<Prisma.MetricHistogram>[] | null = null;
  setInterval(async () => {
    const metrics = await prisma.$metrics.json();

    for (const counter of metrics.counters) {
      ddMetrics.gauge(counter.key, counter.value);
    }
    for (const gauge of metrics.gauges) {
      ddMetrics.gauge(gauge.key, gauge.value);
    }

    if (previousHistograms === null) {
      previousHistograms = diffMetrics(metrics.histograms);
      return;
    }
    const diffHistograms = diffMetrics(metrics.histograms);
    for (const [histogramIndex, histogram] of diffHistograms.entries()) {
      for (const [bucketIndex, values] of histogram.value.buckets.entries()) {
        const [bucket, count] = values;
        const [_, prev] = previousHistograms[histogramIndex]?.value.buckets[
          bucketIndex
        ] ?? [bucket, 0];
        const change = count - prev;

        for (let sendTimes = 0; sendTimes < change; sendTimes++) {
          ddMetrics.histogram(histogram.key, bucket);
        }
      }
    }
    previousHistograms = diffHistograms;
  }, refreshRate);
}

function collectTraces() {
  // Configure the trace provider
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "Backend Prisma",
      [SemanticResourceAttributes.CONTAINER_ID]: process.env.CONTAINER
    })
  });
  // Configure how spans are processed and exported
  provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter()));

  // Register your auto-instrumentors
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new PrismaInstrumentation()]
  });

  // Register the provider globally
  provider.register({
    contextManager: new DatadogContextManager()
  });
}

function diffMetrics(metrics: Prisma.Metric<Prisma.MetricHistogram>[]) {
  return metrics.map(metric => {
    let prev = 0;
    const diffBuckets = metric.value.buckets.map(values => {
      const [bucket, value] = values;
      const diff = value - prev;
      prev = value;
      return [bucket, diff] as Prisma.MetricHistogramBucket;
    });
    metric.value.buckets = diffBuckets;
    return metric;
  });
}

export default prisma;
