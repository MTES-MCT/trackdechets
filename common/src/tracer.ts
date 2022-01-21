import tracer from "dd-trace";

if (process.env.NODE_ENV !== "test") {
  tracer.init({
    logInjection: true,
  });
}

export { tracer };
