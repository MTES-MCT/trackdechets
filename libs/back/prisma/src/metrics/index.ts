import { Prisma, PrismaClient } from "@prisma/client";
import { ObservableGauge, Histogram, metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("prisma");

const observableGauges = new Map<string, ObservableGauge>();
const observableGaugeValues = new Map<string, number>();
const histograms = new Map<string, Histogram>();

// Until we have a static gauge in Otel (pretty soon, merged but hidden), we have to use observable gauges
// cf https://github.com/open-telemetry/opentelemetry-js/pull/4528
function observeMetric({
  key,
  description,
  value
}: Omit<Prisma.Metric<number>, "labels">) {
  observableGaugeValues.set(key, value);

  if (!observableGauges.has(key)) {
    const gauge = meter.createObservableGauge(key, { description });
    gauge.addCallback(c => c.observe(observableGaugeValues.get(key) ?? 0));

    observableGauges.set(key, gauge);
  }
}

function createOrGetHistogram(name: string, description: string) {
  if (!histograms.has(name)) {
    const histogram = meter.createHistogram(name, { description });
    histograms.set(name, histogram);
  }

  return histograms.get(name)!;
}

export function collectMetrics(prisma: PrismaClient) {
  const flushIntervalSeconds = 15;
  const refreshRate = 1000 * flushIntervalSeconds;

  let previousHistograms: Prisma.Metric<Prisma.MetricHistogram>[] | null = null;
  setInterval(async () => {
    const prismaMetrics = await prisma.$metrics.json();

    for (const counter of prismaMetrics.counters) {
      observeMetric({
        key: counter.key,
        description: counter.description,
        value: counter.value
      });
    }
    for (const gauge of prismaMetrics.gauges) {
      observeMetric({
        key: gauge.key,
        description: gauge.description,
        value: gauge.value
      });
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
