import { metrics } from "@opentelemetry/api";

const METRIC_INTERVAL_MS = 30000;

export function initializeNodeRuntimeMetrics() {
  const meter = metrics.getMeter("nodejs-runtime-metrics");

  // Memory metrics (gauges)
  const heapUsedGauge = meter.createGauge("nodejs_heap_used", {
    description: "V8 heap memory used in bytes",
    unit: "By"
  });

  const heapTotalGauge = meter.createGauge("nodejs_heap_total", {
    description: "Total allocated V8 heap memory in bytes",
    unit: "By"
  });

  const heapRssGauge = meter.createGauge("nodejs_heap_rss", {
    description: "Resident set size (total memory usage) in bytes",
    unit: "By"
  });

  const heapExternalGauge = meter.createGauge("nodejs_heap_external", {
    description: "V8 external memory usage in bytes",
    unit: "By"
  });

  // Process metrics (gauges)
  const processUptimeGauge = meter.createGauge("nodejs_process_uptime", {
    description: "Process uptime in seconds",
    unit: "s"
  });

  // Performance metrics (histograms)
  const eventLoopLagHistogram = meter.createHistogram("nodejs_eventloop_lag", {
    description: "Event loop lag in milliseconds",
    unit: "ms"
  });

  const cpuUserHistogram = meter.createHistogram("nodejs_cpu_user", {
    description: "CPU user time delta in milliseconds",
    unit: "ms"
  });

  const cpuSystemHistogram = meter.createHistogram("nodejs_cpu_system", {
    description: "CPU system time delta in milliseconds",
    unit: "ms"
  });

  let lastCpuUsage = process.cpuUsage();

  const recordRuntimeMetrics = () => {
    const memUsage = process.memoryUsage();

    heapUsedGauge.record(memUsage.heapUsed);
    heapTotalGauge.record(memUsage.heapTotal);
    heapRssGauge.record(memUsage.rss);
    heapExternalGauge.record(memUsage.external);

    processUptimeGauge.record(process.uptime());

    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      eventLoopLagHistogram.record(lag);
    });

    // Record CPU metrics (deltas)
    const currentCpuUsage = process.cpuUsage();
    const userDelta = (currentCpuUsage.user - lastCpuUsage.user) / 1000; // Convert to milliseconds
    const systemDelta = (currentCpuUsage.system - lastCpuUsage.system) / 1000;

    cpuUserHistogram.record(userDelta);
    cpuSystemHistogram.record(systemDelta);

    lastCpuUsage = currentCpuUsage;
  };

  const metricsInterval = setInterval(recordRuntimeMetrics, METRIC_INTERVAL_MS);
  // Allow process to exit even with pending timer
  metricsInterval.unref();

  recordRuntimeMetrics();

  return () => {
    clearInterval(metricsInterval);
  };
}
