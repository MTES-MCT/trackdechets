import express, { json } from "express";
import supertest from "supertest";
import Transport from "winston-transport";
import logger from "../../../logging/logger";
import loggingMiddleware from "../loggingMiddleware";
import { gql } from "graphql-tag";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { GraphQLContext } from "../../../types";
import { gqlInfosPlugin } from "../../plugins/gqlInfosPlugin";
import cors from "cors";

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

  let request;
  beforeAll(async () => {
    const app = express();
    app.use(json());
    app.use(loggingMiddleware("/graphql"));

    // Include Apollo as it enrich the request with gqlInfos, used for logging
    const typeDefs = gql`
      type Foo {
        bar: String
      }
      type Query {
        foo: Foo
      }
    `;
    const resolvers = {
      Query: {
        foo: () => ({ bar: "bar" })
      }
    };
    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
      plugins: [gqlInfosPlugin()]
    });
    await server.start();
    app.use(
      "/graphql",
      cors({
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true
      }),
      json(),
      expressMiddleware(server, {
        context: ctx => {
          return ctx as any;
        }
      })
    );

    app.get("/hello", (_, res) => {
      res.status(200).send("world");
    });

    request = supertest(app);
  });

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
    await request.post("/graphql").send({ query: "{ foo { bar } }" });
    expect(logMock.mock.calls).toHaveLength(2);

    for (const logCall of logMock.mock.calls) {
      const { message, level, graphql_query } = logCall[0];
      expect(message).toEqual("POST /graphql");
      expect(level).toEqual("info");
      expect(graphql_query).toEqual("{ foo { bar } }");
    }

    const startLog = logMock.mock.calls[0][0];
    expect(startLog.request_timing).toEqual("start");

    const responseLog = logMock.mock.calls[1][0];
    expect(responseLog.graphql_selection_name).toEqual("foo");
    expect(responseLog.graphql_operation).toEqual("query");
    expect(responseLog.user).toEqual("anonyme");
    expect(responseLog.response_body.trim()).toEqual(
      '{"data":{"foo":{"bar":"bar"}}}'
    );
    expect(responseLog.execution_time_num).toBeGreaterThanOrEqual(0);
    expect(responseLog.http_status).toEqual(200);
    expect(responseLog.request_timing).toEqual("end");
  });
});
