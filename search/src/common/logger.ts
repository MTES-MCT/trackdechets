import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";

let LOG_PATH =
  process.env.LOG_PATH ?? `${appRoot}/logs/trackdechets-search.log`;

/**
 * Set process.env.FORCE_LOGGER_CONSOLE to switch to Console instead of log file
 */

// Avoid using undefined console.log() in jest context
const LOG_TO_CONSOLE =
  process.env.FORCE_LOGGER_CONSOLE && process.env.JEST_WORKER_ID === undefined;
// use http transport when datadog agent installation is impossible (eg. one-off container)
const LOG_TO_HTTP = process.env.LOG_TO_HTTP && process.env.JEST_WORKER_ID === undefined;


const logger_transports_fallbacks = [
  LOG_TO_CONSOLE
    ? new transports.Console({
        // Simple `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
        format: format.simple()
      })
    : LOG_TO_HTTP
    ? new transports.Http({
        host: "http-intake.logs.datadoghq.com",
        path: `/api/v2/logs?dd-api-key=${
          process.env.DD_API_KEY
        }&ddsource=nodejs&service=${process.env.DD_APP_NAME || "search"}`,
        ssl: true
      })
    : new transports.File({ filename: LOG_PATH })
]

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata(),
    format.json()
  ),
  transports: logger_transports_fallbacks,
  // capture exceptions, also for datadog to report it
  exceptionHandlers: logger_transports_fallbacks
});

export { logger };
