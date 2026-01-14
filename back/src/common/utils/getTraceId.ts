import { trace } from "@opentelemetry/api";

/**
 * Récupère le trace ID OpenTelemetry depuis le span actif
 * @returns Le trace ID au format hexadécimal ou undefined si aucun span n'est actif
 */
export function getOpenTelemetryTraceId(): string | undefined {
  try {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      // Le trace ID est retourné au format hexadécimal
      // On le convertit en string pour l'envoyer à Sentry
      return spanContext.traceId;
    }
  } catch (error) {
    // Si OpenTelemetry n'est pas disponible ou désactivé, on ignore silencieusement
    // Cela permet au code de fonctionner même si OTEL est désactivé
  }
  return undefined;
}

