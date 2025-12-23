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

  beforeAll(async () => {
    const app = express();
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

    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
      plugins: [
        gqlInfosPlugin(), // We rely on `gqlInfosPlugin`
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
});
