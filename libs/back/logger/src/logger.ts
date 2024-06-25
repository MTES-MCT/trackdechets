import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";
import { addMetadata } from "./format";

const LOG_PATH = `${appRoot}/logs/app.log`;
// Avoid using undefined console.log() in jest context
const LOG_TO_CONSOLE =
  process.env.FORCE_LOGGER_CONSOLE && process.env.JEST_WORKER_ID === undefined;

export const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(
    addMetadata(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    LOG_TO_CONSOLE
      ? new transports.Console({
          // Simple `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
          format: format.simple()
        })
      : new transports.File({ filename: LOG_PATH })
  ]
});
