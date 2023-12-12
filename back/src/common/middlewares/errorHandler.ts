import { Request, Response, NextFunction } from "express";
import { logger } from "@td/logger";

const { NODE_ENV } = process.env;

/**
 * Custom express error handler middleware
 * It is used to log error messages and to prevent
 * errors from being leaked in production
 * It should be added at the very end of express server definition
 * See also https://expressjs.com/fr/guide/error-handling.html
 */
export default (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message, { stacktrace: err.stack });
  if (res.headersSent) {
    // see https://expressjs.com/fr/guide/error-handling.html
    return next(err);
  }
  if (NODE_ENV === "production") {
    if (err instanceof SyntaxError) {
      return res.status(400).send({ error: "JSON mal formaté ou invalide" });
    }
  }
  return next(err);
};
