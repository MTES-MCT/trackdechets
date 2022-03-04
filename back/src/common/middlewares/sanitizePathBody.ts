import { Request, Response, NextFunction } from "express";
import xss, { IFilterXSSOptions } from "xss";

const xssOptions: IFilterXSSOptions = {
  stripIgnoreTag: true,
  escapeHtml: s => s
};

/**
 * Remove XSS from GraphQL responses
 */
export default function sanitizePathBodyMiddleware(path: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    // We only sanitize GraphQL requests
    if (req.path !== path) {
      return next();
    }
    const oldSend = res.send;
    res.send = (body, ...args) => {
      switch (typeof body) {
        case "string":
          return oldSend.apply(res, [xss(body, xssOptions), ...args]);
        case "boolean":
          return oldSend.apply(res, [body, ...args]);
        default:
          if (Buffer.isBuffer(body)) {
            return oldSend.apply(res, [
              Buffer.from(xss(body.toString(), xssOptions)),
              ...args
            ]);
          }
          // Sanitize any other case
          return oldSend.apply(res, [
            JSON.parse(xss(JSON.stringify(body), xssOptions)),
            ...args
          ]);
      }
    };

    next();
  };
}
