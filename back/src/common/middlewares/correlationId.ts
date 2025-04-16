import { runWithCorrelationId } from "@td/logger";
import { Request, Response, NextFunction } from "express";

export function correlationIdMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  runWithCorrelationId(() => {
    next();
  });
}
