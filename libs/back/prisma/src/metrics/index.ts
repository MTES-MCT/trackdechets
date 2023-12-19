import { Prisma, PrismaClient } from "@prisma/client";
import * as ddMetrics from "datadog-metrics";

export function collectMetrics(prisma: PrismaClient) {
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
