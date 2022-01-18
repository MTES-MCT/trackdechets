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
  transports: [new transports.File({ filename: LOG_PATH })]
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// avoid using missing console.log() function in CI https://jestjs.io/docs/environment-variables
if (process.env.NODE_ENV === "dev" && !process.env.JEST_WORKER_ID) {
  logger.add(
    new transports.Console({
      format: format.simple()
    })
  );
}

export default logger;
