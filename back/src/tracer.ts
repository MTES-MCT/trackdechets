import { tracer } from "dd-trace";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PrismaInstrumentation } from "@prisma/instrumentation";

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
  }
}

export { tracer };
