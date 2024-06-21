import { logger } from "@td/logger";
import { AsyncResource } from "node:async_hooks";
import { join } from "node:path";
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
  const path =
    request.path !== "/"
      ? join(request.baseUrl, request.path)
      : request.baseUrl; // In case the gql endpoint is mounted into a subpath
  const message = `${request.method} ${path}`;

  let requestMetadata: Record<string, any> = {
    ip: request.ip,
    http_params: request.params,
    http_query: request.query,
    http_path: join(request.baseUrl, path),
    http_method: request.method,
    request_timing: requestTiming
  };

  // GraphQL specific fields
  if (
    graphQLPath &&
    path.startsWith(graphQLPath) &&
    request.method === "POST"
  ) {
    requestMetadata.graphql_operation_name = request.body?.operationName;
    requestMetadata.graphql_variables = request.body?.variables;
    requestMetadata.graphql_query = request.body?.query;
  }

  if (["end", "error"].includes(requestTiming)) {
    requestMetadata = {
      ...requestMetadata,
      user: request.user?.email || "anonyme",
      auth: request.user?.auth,
      http_status: response.statusCode,
      request_timing: "end",
      execution_time_num: responseTime, // in millis
      response_body: Buffer.isBuffer(response.locals.body)
        ? null
        : response.locals.body,
      graphql_operation: request.gqlInfos?.[0]?.operation,
      graphql_selection_name: request.gqlInfos?.[0]?.name
    };
  }

  if (requestTiming === "error") {
    return logger.error(message, requestMetadata);
  }

  logger.info(message, requestMetadata);
}
