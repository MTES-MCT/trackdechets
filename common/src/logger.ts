import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";

const LOG_PATH = `${appRoot}/logs/app.log`;

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
    process.env.API_LOGS_CONSOLE
      ? new transports.File({ filename: LOG_PATH })
      : new transports.Console({
          format: format.simple(),
        }),
  ],
});

export { logger };
