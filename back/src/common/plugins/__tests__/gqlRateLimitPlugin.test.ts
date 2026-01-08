import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { gql } from "graphql-tag";
import express, { json } from "express";
import supertest from "supertest";
import cors from "cors";
import { gqlInfosPlugin } from "../gqlInfosPlugin";
import { GraphQLContext } from "../../../types";
import { gqlRateLimitPlugin } from "../gqlRateLimitPlugin";

jest.mock("../../redis", () => ({}));

describe("gqlRateLimitPlugin", () => {
  let request;
  let server;
  let app;

  beforeEach(async () => {
    app = express();
    const typeDefs = gql`
      type Foo {
        bar: String
      }
      type Query {
        accessTokens: Foo
        foo: Foo
      }
    `;

    const resolvers = {
      Query: {
        accessTokens: () => ({ bar: "bar" }),
        foo: () => ({ bar: "bar" })
      }
    };

    server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
      plugins: [
        gqlInfosPlugin(),
        gqlRateLimitPlugin({
          accessTokens: {
            maxRequestsPerWindow: 1,
            windowMs: 10000
          }
        })
      ]
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

    request = supertest(app);
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    app = undefined;
    request = undefined;
    server = undefined;
  });

  it("should only allow 1 request per timeframe on rate limited query", async () => {
    const body = { query: "{ accessTokens { bar } }" };
    const response1 = await request.post("/graphql").send(body);
    expect(response1.status).toEqual(200);

    const response2 = await request.post("/graphql").send(body);
    expect(response2.status).toEqual(429);
  });

  it("should not rate limit other queries", async () => {
    const body = { query: "{ foo { bar } }" };
    const response1 = await request.post("/graphql").send(body);
    expect(response1.status).toEqual(200);

    const response2 = await request.post("/graphql").send(body);
    expect(response2.status).toEqual(200);
  });

  it("should rate limit each aliased operation independently in a single request", async () => {
    // This query sends two aliased accessTokens queries in a single request
    const body = {
      query: `{
        a1: accessTokens { bar }
        a2: accessTokens { bar }
      }`
    };

    const response = await request.post("/graphql").send(body);

    // The middleware blocks the whole request if any operation exceeds the limit
    expect(response.status).toBe(429);

    // The response should contain a rate limit error message
    expect(
      response.text.includes("Quota") ||
        (response.body &&
          response.body.errors &&
          response.body.errors.some((e: any) =>
            /rate limit|quota/i.test(e.message)
          ))
    ).toBe(true);
  });
});
