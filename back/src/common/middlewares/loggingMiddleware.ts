import { Request, Response, NextFunction } from "express";
import logger from "../../logging/logger";
import { getUid } from "../../utils";

/**
 * Logging middleware
 * For each request we generate a log on start and finish. This enable us to detect requests that never finish.
 * The logs share the same `request_id`. A `request_timing` property indicates the timing of the log (start/end)
 */
export default function (graphQLPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const message = `${req.method} ${req.path}`;
    const requestMetadata: { [key: string]: any } = {
      user: req.user?.email || "anonyme",
      auth: req.user?.auth,
      ip: req.ip,
      http_params: req.params,
      http_query: req.query,
      request_timing: "start",
      request_id: getUid(16)
    };
    // GraphQL specific fields
    if (req.path === graphQLPath && req.method === "POST") {
      requestMetadata.graphql_operation_name = req.body?.operationName;
      requestMetadata.graphql_variables = req.body?.variables;
      requestMetadata.graphql_query = req.body?.query;
    }

    logger.info(message, requestMetadata);

    // Monkey patch res.send to retrieves response body
    let responseBody = null;
    const originalSend = res.send;
    res.send = body => {
      responseBody = body;
      return originalSend.call(res, body);
    };

    const start = new Date();

    res.on("finish", () => {
      const end = new Date();

      const metadataWithReponse = {
        ...requestMetadata,
        http_status: res.statusCode,
        request_timing: "end",
        execution_time_num: end.getTime() - start.getTime(), // in millis
        response_body: Buffer.isBuffer(responseBody) ? null : responseBody
      };

      logger.info(message, metadataWithReponse);
    });

    next();
  };
}
