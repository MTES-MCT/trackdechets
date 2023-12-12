import { tracer } from "dd-trace";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { createHook } from "node:async_hooks";
import { logger } from "@td/logger";

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

if (process.env.NODE_ENV !== "test") {
  const { TracerProvider } = tracer.init({
    logInjection: true
  });

  // If tracer is disabled, a noop proxy is loaded and the instrumentation fails
  if (process.env.DD_TRACE_ENABLED !== "false") {
    const provider = new TracerProvider();
    registerInstrumentations({
      tracerProvider: provider,
      instrumentations: [new PrismaInstrumentation({})]
    });

    // Register the provider globally
    provider.register();

    // Create an async hook to measure event loop delay.
    // This is using async hooks and not AsyncLocalStorage because we want to report the information
    // to Datadog, and dd-js uses async hooks. This enable us to attach new spans to the current async context.
    const asyncHook = createHook({ before, after });
    asyncHook.enable();
  }
}

export { tracer };
