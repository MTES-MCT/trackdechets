import { logger } from "@td/logger";
import { tracer } from "dd-trace";
import { createHook } from "node:async_hooks";

const THRESHOLD_NS =
  parseInt(process.env.EVENT_LOOP_THRESHOLD_MS ?? "200", 10) * 1e6;
const cache = new Map<number, bigint>();

function before(asyncId: number) {
  cache.set(asyncId, process.hrtime.bigint());
}

function after(asyncId: number) {
  const start = cache.get(asyncId);
  if (start == null) {
    return;
  }
  cache.delete(asyncId);

  const end = process.hrtime.bigint();
  const diff = end - start;
  if (diff > THRESHOLD_NS) {
    const time = Number(diff / BigInt(1e6));
    logger.warn({
      label: "EventLoopMonitor",
      message: `Event loop was blocked for ${time}ms`,
      metadata: {
        time
      }
    });

    const span = tracer.startSpan("EventLoopBlock", {
      childOf: tracer.scope().active() ?? undefined,
      startTime: new Date().getTime() - time,
      tags: {
        ["service.name"]: "event-loop-monitor"
      }
    });
    span.finish();
  }
}

export const eventLoopAsyncHook = createHook({ before, after });
