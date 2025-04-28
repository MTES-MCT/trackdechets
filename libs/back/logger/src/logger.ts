import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";
import { addMetadata } from "./format";

const LOG_PATH = `${appRoot}/logs/app.log`;
// Avoid using undefined console.log() in jest context
const LOG_TO_CONSOLE =
  process.env.FORCE_LOGGER_CONSOLE === "true" &&
  process.env.JEST_WORKER_ID === undefined;
const sensitiveFields = ["password", "token", "secret", "key"];
const sanitizeObject = (obj: any) => {
  if (!obj || typeof obj !== "object") return obj;

  for (const key in obj) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      obj[key] = "[REDACTED]";
    } else if (typeof obj[key] === "object") {
      if (obj[key] !== null && !Array.isArray(obj[key])) {
        obj[key] = sanitizeObject({
          ...obj[key]
        });
      }
    }
  }
  return obj;
};
const sanitizeVariables = (variables: Record<string, any>) => {
  const sanitized = { ...variables };

  return sanitizeObject(sanitized);
};

export const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(
    addMetadata(),
    format.errors({ stack: true }),
    format.json(),
    format(info => {
      if (!info.graphql_variables) {
        return info;
      }
      return {
        ...info,
        graphql_variables: sanitizeVariables(info.graphql_variables)
      };
    })()
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
