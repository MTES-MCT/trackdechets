import { Pool } from "pg";
import { metrics } from "@opentelemetry/api";

const METRIC_INTERVAL_MS = 30000;

export function initializePoolMetrics(pool: Pool) {
  const meter = metrics.getMeter("prisma-pool-metrics");

  const totalCountGauge = meter.createGauge("pg_pool_total_count", {
    description: "Total number of clients in the PostgreSQL pool"
  });

  const idleCountGauge = meter.createGauge("pg_pool_idle_count", {
    description: "Number of idle clients in the PostgreSQL pool"
  });

  const waitingCountGauge = meter.createGauge("pg_pool_waiting_count", {
    description:
      "Number of clients waiting for a connection from the PostgreSQL pool"
  });

  const expiredCountGauge = meter.createGauge("pg_pool_expired_count", {
    description: "Number of expired clients in the PostgreSQL pool"
  });

  const recordPoolMetrics = () => {
    totalCountGauge.record(pool.totalCount);
    idleCountGauge.record(pool.idleCount);
    waitingCountGauge.record(pool.waitingCount);
    expiredCountGauge.record(pool.expiredCount);
  };

  const metricsInterval = setInterval(recordPoolMetrics, METRIC_INTERVAL_MS);
  // Allow process to exit even with pending timer
  metricsInterval.unref();

  recordPoolMetrics();

  return () => {
    clearInterval(metricsInterval);
  };
}
