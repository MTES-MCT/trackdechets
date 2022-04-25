import express, { json } from "express";
import supertest from "supertest";
import Transport from "winston-transport";
import logger from "../../../logging/logger";
import { graphqlQueryParserMiddleware } from "../graphqlQueryParser";
import loggingMiddleware from "../loggingMiddleware";

const logMock = jest.fn();

class MockTransport extends Transport {
  log(info, callback) {
    logMock(info);
    callback();
  }
}

const transport = new MockTransport();

logger.add(transport);

describe("loggingMiddleware", () => {
  afterEach(() => {
    logMock.mockReset();
  });

  afterAll(() => {
    logger.remove(transport);
  });

  const app = express();
  const graphQLPath = "/";
  app.use(json());
  app.use(graphQLPath, graphqlQueryParserMiddleware()); // We rely on `graphqlQueryParserMiddleware`
  app.use(loggingMiddleware("/"));
  app.get("/hello", (req, res) => {
    res.status(200).send("world");
  });
  app.post(graphQLPath, (_req, res) => {
    res.status(200).send({ data: { me: { name: "John Snow" } } });
  });

  const request = supertest(app);

  it("should log requests to standard express endpoint", async () => {
    await request.get("/hello");
    expect(logMock.mock.calls).toHaveLength(2);
    for (const logCall of logMock.mock.calls) {
      const { message, level } = logCall[0];
      expect(message).toEqual("GET /hello");
      expect(level).toEqual("info");
    }
    const startLog = logMock.mock.calls[0][0];
    expect(startLog.request_timing).toEqual("start");

    const responseLog = logMock.mock.calls[1][0];
    expect(responseLog.user).toEqual("anonyme");
    expect(responseLog.response_body).toEqual("world");
    expect(responseLog.execution_time_num).toBeGreaterThanOrEqual(0);
    expect(responseLog.http_status).toEqual(200);
    expect(responseLog.request_timing).toEqual("end");
  });

  it("should log requests to GraphQL endpoint", async () => {
    await request.post(graphQLPath).send({ query: "{ me { name } }" });
    expect(logMock.mock.calls).toHaveLength(2);

    for (const logCall of logMock.mock.calls) {
      const {
        message,
        level,
        graphql_query,
        graphql_selection_name,
        graphql_operation
      } = logCall[0];
      expect(message).toEqual("POST /");
      expect(level).toEqual("info");
      expect(graphql_query).toEqual("{ me { name } }");
      expect(graphql_selection_name).toEqual("me");
      expect(graphql_operation).toEqual("query");
    }

    const startLog = logMock.mock.calls[0][0];
    expect(startLog.request_timing).toEqual("start");

    const responseLog = logMock.mock.calls[1][0];
    expect(responseLog.user).toEqual("anonyme");
    expect(responseLog.response_body).toEqual(
      '{"data":{"me":{"name":"John Snow"}}}'
    );
    expect(responseLog.execution_time_num).toBeGreaterThanOrEqual(0);
    expect(responseLog.http_status).toEqual(200);
    expect(responseLog.request_timing).toEqual("end");
  });
});
