import { Request, Response, NextFunction } from "express";

const MAX_OPERATIONS_PER_REQUEST = 5;

export function graphqlBatchLimiterMiddleware() {
  return function graphqlBatchLimiter(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { body } = req;

    if (Array.isArray(body)) {
      if (body.length > MAX_OPERATIONS_PER_REQUEST) {
        return res.status(400).send({
          error: `Batching is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per request.`
        });
      }
    }

    if (Object.keys(body).length > MAX_OPERATIONS_PER_REQUEST) {
      return res.status(400).send({
        error: `Batching is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per query.`
      });
    }

    next();
  };
}
