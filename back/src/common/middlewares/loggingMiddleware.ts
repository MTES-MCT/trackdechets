import { logger } from "@td/logger";
import { AsyncResource } from "node:async_hooks";
import { Request, Response, NextFunction } from "express";

/**
 * Logging middleware
 * For each request we generate a log on start and finish. This enable us to detect requests that never finish.
 * A `request_timing` property indicates the timing of the log (start/end)
 */
export function loggingMiddleware(graphQLPath: string) {
  return function logging(req: Request, res: Response, next: NextFunction) {
    logExpressRequest(req, res, { requestTiming: "start", graphQLPath });

    const startTime = Date.now();

    const { send, end } = res;

    res.send = body => {
      res.send = send;
      res.locals.body = body;
      return res.send(body);
    };

    // To keep the request correlationId we bind the event handler to its parent context
    const onClose = AsyncResource.bind(() => {
      req.socket.off("close", onClose);
      console.log("close", res.headersSent);
      if (res.headersSent) {
        return;
      }

      logExpressRequest(req, res, {
        requestTiming: "error",
        graphQLPath
      });
    });

    // Sometimes the connection is closed without calling res.end (ex: gateway times out the request before app does)
    req.socket.on("close", onClose);

    res.end = ((chunk: any, encoding: BufferEncoding) => {
      res.end = end;
      const responseTime = Date.now() - startTime;
      req.socket.off("close", onClose);

      logExpressRequest(req, res, {
        requestTiming: "end",
        responseTime,
        graphQLPath
      });

      return res.end(chunk, encoding);
    }) as any;

    next();
  };
}

function logExpressRequest(
  request: Request,
  response: Response,
  {
    requestTiming,
    responseTime,
    graphQLPath
  }: {
    requestTiming: "start" | "end" | "error";
    responseTime?: number;
    graphQLPath?: string;
  }
) {
  const message = `${request.method} ${request.path}`;

  let requestMetadata: Record<string, any> = {
    ip: request.ip,
    http_params: request.params,
    http_query: request.query,
    http_path: request.path,
    http_method: request.method,
    request_timing: requestTiming
  };

  // GraphQL specific fields
  if (request.path === graphQLPath && request.method === "POST") {
    requestMetadata.graphql_operation_name = request.body?.operationName;
    requestMetadata.graphql_variables = request.body?.variables;
    // requestMetadata.graphql_query = request.body?.query;
  }

  if (["end", "error"].includes(requestTiming)) {
    requestMetadata = {
      ...requestMetadata,
      user: request.user?.email || "anonyme",
      auth: request.user?.auth,
      http_status: response.statusCode,
      request_timing: "end",
      execution_time_num: responseTime, // in millis
      // response_body: Buffer.isBuffer(response.locals.body)
      //   ? null
      //   : response.locals.body,
      graphql_operation: request.gqlInfos?.[0]?.operation,
      graphql_selection_name: request.gqlInfos?.[0]?.name
    };
  }

  if (requestTiming === "error") {
    return logger.error(message, requestMetadata);
  }

  logger.info(message, requestMetadata);
}
