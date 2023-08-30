import { Request, Response, NextFunction, text } from "express";

/**
 * GraphQL server middleware to:
 * - accept JSON-encoded strings for gql variables
 * - support application/graphql requests (taken from https://github.com/graphql-middleware/body-parser-graphql)
 */
export function graphqlBodyParser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (typeof req.body?.variables === "string") {
    try {
      req.body.variables = JSON.parse(req.body.variables);
    } catch (e) {
      // https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#json-parsing-failure
      res.status(400).send(e instanceof Error ? e.message : e);
    }
  }

  if (req.is("application/graphql")) {
    text({ type: "application/graphql" })(req, res, () => {
      req.headers["content-type"] = "application/json";
      req.body = {
        query: req.body
      };
      next();
    });
  } else {
    next();
  }
}
