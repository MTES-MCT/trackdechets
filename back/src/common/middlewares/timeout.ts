import { Request, Response, NextFunction } from "express";

// Scalingo times out after 1min, we take a margin
// See https://doc.scalingo.com/platform/internals/routing#timeouts for more details
const TIMEOUT_MS = 1000 * (60 + 5);

export function timeoutMiddleware(delay?: number) {
  return function timeoutLongRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    res.setTimeout(delay ?? TIMEOUT_MS, () => {
      if (res.headersSent) {
        return;
      }

      res.status(408).send("Request has timed out.");
      req.timedOut = true; // Mark the request as timed out
    });

    next();
  };
}
