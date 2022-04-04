import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";

const LOG_PATH = `${appRoot}/logs/app.log`;

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(format.errors({ stack: true }), format.json()),
  transports: [new transports.File({ filename: LOG_PATH })]
});

// TODO - remove
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.info("Memory usage - TEMP", memoryUsage);
}, 1000 * 60 * 3);

export default logger;
