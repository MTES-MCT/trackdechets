import { Request, Response, NextFunction } from "express";

export const MAX_OPERATIONS_PER_REQUEST = 5;

export function graphqlBatchLimiterMiddleware() {
  return function graphqlBatchLimiter(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { body } = req;

    // query batching with arrays is a Transport-level batching technique
    if (Array.isArray(body) && body.length > MAX_OPERATIONS_PER_REQUEST) {
      return res.status(400).send({
        error: `Batching is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per request.`
      });
    }

    next();
  };
}
