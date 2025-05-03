import { Request, Response, NextFunction, RequestHandler } from "express";
import { trace } from "@opentelemetry/api";

// Wrap third-party middleware to provide names
export function namedMiddleware(name: string, middlewareFn: RequestHandler) {
  const wrapper = function (req: Request, res: Response, next: NextFunction) {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.updateName(`middleware.${name}`);
    }
    return middlewareFn(req, res, next);
  };

  Object.defineProperty(wrapper, "name", { value: name });
  return wrapper;
}
