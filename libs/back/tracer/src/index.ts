import { tracer } from "dd-trace";
import { eventLoopAsyncHook } from "./eventLoop";

if (process.env.NODE_ENV !== "test") {
  tracer.init({
    logInjection: true
  });

  // If tracer is disabled, a noop proxy is loaded and the instrumentation fails
  if (process.env.DD_TRACE_ENABLED !== "false") {
    // Create an async hook to measure event loop delay.
    // This is using async hooks and not AsyncLocalStorage because we want to report the information
    // to Datadog, and dd-js uses async hooks. This enable us to attach new spans to the current async context.
    eventLoopAsyncHook.enable();
  }
}

export { tracer };
