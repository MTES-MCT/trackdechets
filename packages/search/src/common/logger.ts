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

// Docs https://docs.datadoghq.com/fr/logs/log_collection/nodejs/?tab=winston30
const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata(),
    format.json()
  ),
  transports: [
    !LOG_TO_CONSOLE
      ? new transports.File({ filename: LOG_PATH })
      : new transports.Console({
          // Simple `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
          format: format.simple()
        })
  ],
  // capture exceptions, also for datadog to report it
  exceptionHandlers: [
    !LOG_TO_CONSOLE
      ? new transports.File({ filename: LOG_PATH })
      : new transports.Console({
          format: format.simple()
        })
  ]
});

export { logger };
