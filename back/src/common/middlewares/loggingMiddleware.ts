import { Request, Response, NextFunction } from "express";
import logger from "../../logging/logger";

/**
 * Logging middleware
 */
export default function (graphQLPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
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
      const message = `${req.method} ${req.path}`;
      const meta: { [key: string]: any } = {
        user: req.user?.email || "anonyme",
        auth: req.user?.auth,
        ip: req.ip,
        execution_time_num: end.getTime() - start.getTime(), // in millis,
        http_params: req.params,
        http_query: req.query,
        http_status: res.statusCode,
        response_body: Buffer.isBuffer(responseBody) ? null : responseBody
      };
      // GraphQL specific fields
      if (req.path === graphQLPath && req.method === "POST") {
        meta.graphql_operation_name = req.body?.operationName;
        meta.graphql_variables = req.body?.variables;
        meta.graphql_query = req.body?.query;
      }
      logger.info(message, meta);
    });

    next();
  };
}
