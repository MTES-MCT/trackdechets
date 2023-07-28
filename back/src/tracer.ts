import { tracer } from "dd-trace";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PrismaInstrumentation } from "@prisma/instrumentation";

if (process.env.NODE_ENV !== "test") {
  const { TracerProvider } = tracer.init({
    logInjection: true
  });

  const provider = new TracerProvider();
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new PrismaInstrumentation({})]
  });

  // Register the provider globally
  provider.register();
}

export { tracer };
