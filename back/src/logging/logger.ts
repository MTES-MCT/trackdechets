import { createLogger, format, transports } from "winston";

const LOG_PATH = `${process.cwd()}/logs/app.log`;
const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata(),
    format.simple()
  ),
  transports: [new transports.File({ filename: LOG_PATH })]
});

export default logger;
