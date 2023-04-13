import { Request, Response, NextFunction } from "express";

// Scalingo times out after 1min, we take a margin
// See https://doc.scalingo.com/platform/internals/routing#timeouts for more details
const TIMEOUT_MS = 1000 * 60 * 2;

export function timeoutMiddleware(delay?: number) {
  return function timeoutLongRequests(
    _: Request,
    res: Response,
    next: NextFunction
  ) {
    res.setTimeout(delay ?? TIMEOUT_MS, () => {
      res.status(408).send("Request has timed out.");
    });

    next();
  };
}
