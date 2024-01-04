import { tracer } from "dd-trace";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { eventLoopAsyncHook } from "./eventLoop";

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
    eventLoopAsyncHook.enable();
  }
}

export { tracer };
