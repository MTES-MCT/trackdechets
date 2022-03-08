import { Request, Response, NextFunction } from "express";

const MAX_OPERATIONS_PER_REQUEST = 5;

export function graphqlBatchLimiterMiddleware(graphQLPath: string) {
  return function (req: Request, _: Response, next: NextFunction) {
    const { body, path } = req;

    if (
      path === graphQLPath &&
      Array.isArray(body) &&
      body.length > MAX_OPERATIONS_PER_REQUEST
    ) {
      throw new Error(
        `Batching is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per request.`
      );
    }

    next();
  };
}
