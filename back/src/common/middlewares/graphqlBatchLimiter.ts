import { Request, Response, NextFunction } from "express";

const MAX_OPERATIONS_PER_REQUEST = 5;

export function graphqlBatchLimiterMiddleware(graphQLPath: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    const { body, path } = req;

    if (
      path === graphQLPath &&
      Array.isArray(body) &&
      body.length > MAX_OPERATIONS_PER_REQUEST
    ) {
      return res
        .status(400)
        .send({
          error: `Batching is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per request.`
        });
    }

    next();
  };
}
