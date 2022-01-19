import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";

const LOG_PATH = `${appRoot}/logs/app.log`;

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata(),
    format.json()
  ),
  transports:
    process.env.NODE_ENV !== "dev" || process.env.JEST_WORKER_ID
      ? [new transports.File({ filename: LOG_PATH })]
      : [new transports.Console({ format: format.simple() })]
});

export default logger;
