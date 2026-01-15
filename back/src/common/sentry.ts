import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";
import { getOpenTelemetryTraceId } from "./utils/getTraceId";

const { SENTRY_DSN, ENV_NAME } = process.env;

export function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENV_NAME,
      integrations: [new CaptureConsole({ levels: ["error"] })],
      beforeSend(event) {
        // Ajouter le trace ID OpenTelemetry à toutes les erreurs capturées
        const traceId = getOpenTelemetryTraceId();
        if (traceId) {
          // Ajouter dans les contexts pour la corrélation avec Datadog
          event.contexts = {
            ...event.contexts,
            trace: {
              trace_id: traceId
            }
          };
        }
        return event;
      }
    });
    return Sentry;
  }
  return null;
}
