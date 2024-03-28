import { logger } from "@td/logger";
import { trace } from "@opentelemetry/api";
import { hrtime } from "node:process";

const THRESHOLD_NS =
  parseInt(process.env.EVENT_LOOP_THRESHOLD_MS ?? "200", 10) * 1e6;
const CHECK_INTERVAL = 100;

export function enableEventLoopMonitor() {
  let start = hrtime.bigint();

  setInterval(function () {
    const end = process.hrtime.bigint();
    const delta = end - start;

    if (delta > THRESHOLD_NS) {
      const deltaInMs = Number(delta / BigInt(1e6));
      const activeSpan = trace.getActiveSpan();
      logger.warn({
        label: "EventLoopMonitor",
        message: `Event loop was blocked for ${deltaInMs}ms`,
        metadata: {
          delta: deltaInMs,
          traceId: activeSpan?.spanContext().traceId,
          spanId: activeSpan?.spanContext().spanId
        }
      });
    }
    start = hrtime.bigint();
  }, CHECK_INTERVAL).unref();
}
