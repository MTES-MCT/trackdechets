import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";

const LOG_PATH = `${appRoot}/logs/app.log`;

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata({ fillExcept: ["level", "message", "dd"] }), // `dd` enable connecting logs & traces
    format.json()
  ),
  transports: [new transports.File({ filename: LOG_PATH })]
});

export default logger;
