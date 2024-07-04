import { Prisma, PrismaClient } from "@prisma/client";
import { Gauge, Histogram, metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("prisma");

const histograms = new Map<string, Histogram>();
const gauges = new Map<string, Gauge>();

function createOrGetHistogram(name: string, description: string) {
  if (!histograms.has(name)) {
    const histogram = meter.createHistogram(name, { description });
    histograms.set(name, histogram);
  }

  return histograms.get(name)!;
}

function createOrGetGauge(name: string, description: string) {
  if (!gauges.has(name)) {
    const gauge = meter.createGauge(name, { description });
    gauges.set(name, gauge);
  }

  return gauges.get(name)!;
}

export function collectMetrics(prisma: PrismaClient) {
  const flushIntervalSeconds = 15;
  const refreshRate = 1000 * flushIntervalSeconds;

  let previousHistograms: Prisma.Metric<Prisma.MetricHistogram>[] | null = null;

  const interval = setInterval(async () => {
    const prismaMetrics = await prisma.$metrics.json();

    for (const counter of prismaMetrics.counters) {
      const recorder = createOrGetGauge(counter.key, counter.description);
      recorder.record(counter.value);
    }
    for (const gauge of prismaMetrics.gauges) {
      const recorder = createOrGetGauge(gauge.key, gauge.description);
      recorder.record(gauge.value);
    }

    if (previousHistograms === null) {
      previousHistograms = diffMetrics(prismaMetrics.histograms);
      return;
    }
    const diffHistograms = diffMetrics(prismaMetrics.histograms);
    for (const [histogramIndex, histogram] of diffHistograms.entries()) {
      for (const [bucketIndex, values] of histogram.value.buckets.entries()) {
        const [bucket, count] = values;
        const [_, prev] = previousHistograms[histogramIndex]?.value.buckets[
          bucketIndex
        ] ?? [bucket, 0];
        const change = count - prev;

        for (let sendTimes = 0; sendTimes < change; sendTimes++) {
          const recorder = createOrGetHistogram(
            histogram.key,
            histogram.description
          );
          recorder.record(bucket);
        }
      }
    }
    previousHistograms = diffHistograms;
  }, refreshRate);

  // Don't let the timer keep the process alive
  interval.unref();
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
