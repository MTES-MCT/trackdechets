import { tracer } from "dd-trace";
import * as api from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";

if (process.env.NODE_ENV !== "test") {
  tracer.init({
    logInjection: true
  });
}

export class DatadogContextManager extends AsyncLocalStorageContextManager {
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

export { tracer };
