import { Request, Response, NextFunction } from "express";
import sanitizeHtml from "sanitize-html";

export default function sanitizePathBodyMiddleware(graphQLPath: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    // We only sanitize GraphQL requests
    if (req.path !== graphQLPath) {
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
    const stringifiedBody = JSON.stringify(req.body);
    const sanitizedStringifiedBody = sanitizeHtml(stringifiedBody);
    req.body = JSON.parse(sanitizedStringifiedBody);

    next();
  };
}
