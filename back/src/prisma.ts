import { URL } from "url";
import { unescape } from "querystring";
import { PrismaClient } from "@prisma/client";
import * as api from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { tracer } from "./tracer";
import {
  BasicTracerProvider,
  BatchSpanProcessor
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PrismaInstrumentation } from "@prisma/instrumentation";

const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrl() }
  },
  log: process.env.NODE_ENV !== "test" ? ["query", "info", "warn", "error"] : []
});

// Expose the active Datadog span context to OpenTelemetry
// From https://github.com/DataDog/dd-trace-js/issues/1244
class DatadogContextManager extends AsyncLocalStorageContextManager {
  active(): api.Context {
    const context = super.active();
    const datadogActiveSpan = tracer.scope().active();

    // Only use the Datadog context if an OpenTelemetry span is not active and there is an active Datadog span.
    const shouldUseDatadogContext =
      !api.trace.getSpanContext(context) && datadogActiveSpan;

    if (!shouldUseDatadogContext) {
      return context;
    }

    // Extract and convert Datadog trace/span IDs to OpenTelemetry format.
    // See: https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/opentelemetry/
    const datadogSpanContext = datadogActiveSpan.context();
    const traceId = BigInt(datadogSpanContext.toTraceId())
      .toString(16)
      .padStart(32, "0");
    const spanId = BigInt(datadogSpanContext.toSpanId())
      .toString(16)
      .padStart(16, "0");

    return api.trace.setSpanContext(context, {
      traceId,
      spanId,

      // Datadog APM uses tail sampling, so we set this flag to always record data.
      traceFlags: api.TraceFlags.SAMPLED
    });
  }
}

const provider = new BasicTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter()));
provider.register({
  contextManager: new DatadogContextManager()
});

new PrismaInstrumentation().enable();

function getDbUrl() {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}

export default prisma;
