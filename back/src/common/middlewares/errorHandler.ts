import { Request, Response, NextFunction } from "express";
import logger from "../../logger";

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
  if (NODE_ENV === "dev") {
    next(err);
  } else {
    // do not leak errors in production
    res.status(500).send("Erreur serveur");
  }
};
