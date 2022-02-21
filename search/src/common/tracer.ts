import tracer from "dd-trace";

if (
  process.env.NODE_ENV !== "test" &&
  process.env.DD_TRACE_ENABLED !== "false"
) {
  tracer.init({
    logInjection: true
  }); // initialisé dans un fichier différent pour empêcher l'accès aux variables avant leur définition.
}

export { tracer };
