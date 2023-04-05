import { Request, Response, NextFunction } from "express";
import { OperationDefinitionNode, parse } from "graphql";

const MAX_OPERATIONS_PER_REQUEST = 5;

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

    if (!!body.query && typeof body.query === "string") {
      // query merging is a batching technique that serialize multiple queries withing the same gql query
      const ast = parse(body.query);
      const [definition] = ast?.definitions as OperationDefinitionNode[];
      const mergedQueries = definition?.selectionSet?.selections?.length;
      if (mergedQueries > MAX_OPERATIONS_PER_REQUEST) {
        return res.status(400).send({
          error: `Batching by query merging is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per query.`
        });
      }
    }

    next();
  };
}
