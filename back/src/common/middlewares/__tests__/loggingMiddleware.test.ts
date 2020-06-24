import express from "express";
import supertest from "supertest";
import Transport from "winston-transport";
import bodyParser from "body-parser";
import loggingMiddleware from "../loggingMiddleware";
import logger from "../../../logging/logger";

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
  app.use(bodyParser.json());
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
    expect(logMock.mock.calls).toHaveLength(1);
    const { message, level, metadata } = logMock.mock.calls[0][0];
    expect(message).toEqual("GET /hello");
    expect(level).toEqual("info");
    expect(metadata.user).toEqual("anonyme");
    expect(metadata.response_body).toEqual("world");
    expect(metadata.execution_time_num).toBeGreaterThanOrEqual(0);
    expect(metadata.http_status).toEqual(200);
  });

  it("should log requests to GraphQL endpoint", async () => {
    await request.post(graphQLPath).send({ query: "{ me { name } }" });
    expect(logMock.mock.calls).toHaveLength(1);
    const { message, level, metadata } = logMock.mock.calls[0][0];
    expect(message).toEqual("POST /");
    expect(level).toEqual("info");
    expect(metadata.user).toEqual("anonyme");
    expect(metadata.response_body).toEqual(
      '{"data":{"me":{"name":"John Snow"}}}'
    );
    expect(metadata.execution_time_num).toBeGreaterThanOrEqual(0);
    expect(metadata.http_status).toEqual(200);
    expect(metadata.graphql_query).toEqual("{ me { name } }");
  });
});
