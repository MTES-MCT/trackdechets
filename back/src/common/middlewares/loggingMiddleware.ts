import { logger } from "@td/logger";
import { AsyncResource } from "node:async_hooks";
import { Request, Response, NextFunction } from "express";

/**
 * Logging middleware
 * For each request we generate a log on start and finish. This enable us to detect requests that never finish.
 * A `request_timing` property indicates the timing of the log (start/end)
 */
export function loggingMiddleware(graphQLPath: string) {
  return function logging(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    logExpressRequest(request, response, {
      requestTiming: "start",
      graphQLPath
    });

    const startTime = Date.now();

    const { send, end } = response;

    response.send = body => {
      response.send = send;
      response.locals.body = body;
      return response.send(body);
    };

    // To keep the request correlationId we bind the event handler to its parent context
    const onClose = AsyncResource.bind(() => {
      request.socket.off("close", onClose);
      if (response.headersSent) {
        return;
      }

      logExpressRequest(request, response, {
        requestTiming: "error",
        graphQLPath
      });
    });

    // Sometimes the connection is closed without calling res.end (ex: gateway times out the request before app does)
    request.socket.on("close", onClose);

    response.end = ((chunk: any, encoding: BufferEncoding) => {
      response.end = end;

      const responseTime = Date.now() - startTime;
      request.socket.off("close", onClose);

      logExpressRequest(request, response, {
        requestTiming: "end",
        responseTime,
        graphQLPath
      });

      return response.end(chunk, encoding);
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
  const path = request.originalUrl.split("?")[0];

  const isStartLog = requestTiming === "start";

  const requestMetadata: Record<string, any> = {
    ip: request.ip,
    http_params: request.params,
    http_query: request.query,
    http_path: path,
    http_method: request.method,
    request_timing: isStartLog ? "start" : "end" // "end" for both end/error
  };

  // GraphQL specific fields
  if (graphQLPath && path === graphQLPath && request.method === "POST") {
    requestMetadata.graphql_operation_name = request.body?.operationName;
    requestMetadata.graphql_variables = request.body?.variables;
    requestMetadata.graphql_query = request.body?.query;
  }

  let logAsError = requestTiming === "error"; // True if client closed connection prematurely
  let logAsWarning = false;

  if (!isStartLog) {
    // Add metadata specific to finished requests ("end" or "error" types)
    requestMetadata.user = request.user?.email ?? "anonyme";
    requestMetadata.auth = request.user?.auth;
    requestMetadata.http_status = response.statusCode;
    requestMetadata.execution_time_num = responseTime; // in millis
    requestMetadata.response_body = Buffer.isBuffer(response.locals.body)
      ? null
      : response.locals.body;
    requestMetadata.graphql_operation = request.gqlInfos?.[0]?.operation;
    requestMetadata.graphql_selection_name = request.gqlInfos?.[0]?.name;
    requestMetadata.graphql_errors = response.locals.gqlErrors;

    // Check for GraphQL errors in the response body to log as error
    if (response.locals.gqlErrors?.length > 0) {
      if (response.locals.hasUndisplayedError) {
        logAsError = true;
      } else {
        logAsWarning = true;
      }
    }
  }

  const message = [request.method, path, requestMetadata.graphql_selection_name]
    .filter(Boolean)
    .join(" ");

  const level = logAsError ? "error" : logAsWarning ? "warn" : "info";
  logger.log(level, message, requestMetadata);
}
