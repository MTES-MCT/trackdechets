import { Request, Response, NextFunction, text } from "express";

/**
 * GraphQL server middleware to support application/graphql requests
 * Taken from https://github.com/graphql-middleware/body-parser-graphql
 */
export default (req: Request, res: Response, next: NextFunction) => {
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
};
