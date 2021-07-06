import { Request, Response, NextFunction } from "express";
import sanitizeHtml from "sanitize-html";

export default function sanitizeGraphqlMiddleware(graphQLPath: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    // We only sanitize GraphQL variables
    if (req.path !== graphQLPath || !req.body.variables) {
      return next();
    }

    /**
     * As easy as Stringify -> Sanitize -> Parse
     * 
     * | Variables                            | Stringify                                 | Sanitize            | Parse          |
     * |--------------------------------------|-------------------------------------------|---------------------|----------------|
     * | { foo: "bar" }                       | "{\"foo\":\"bar\"}"                       | "{\"foo\":\"bar\"}" | { foo: "bar" } |
     * | { foo: "<script>" }                  | "{\"foo\":\"<script>\"}"                  | "{\"foo\":\""       | Error          |
     * | { foo: "<script>alert(1)</script>" } | "{\"foo\":\"<script>alert(1)</script>\"}" | "{\"foo\":\"\"}"    | { foo: "" }    |
     */
    const stringifiedVariables = JSON.stringify(req.body.variables);
    const sanitizedStringifiedVariables = sanitizeHtml(stringifiedVariables);
    req.body.variables = JSON.parse(sanitizedStringifiedVariables);

    next();
  };
}
