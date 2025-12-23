import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { gql } from "graphql-tag";
import express, { json } from "express";
import supertest from "supertest";
import cors from "cors";
import { gqlInfosPlugin } from "../gqlInfosPlugin";
import { GraphQLContext } from "../../../types";

describe("gqlInfosPlugin", () => {
  let request;
  let req;

  beforeAll(async () => {
    const app = express();
    const typeDefs = gql`
      type Foo {
        bar: String
      }
      type Query {
        foo: Foo
      }
      type Mutation {
        createFoo: Foo
      }
    `;

    const resolvers = {
      Query: {
        foo: () => ({ bar: "bar" })
      },
      Mutation: {
        createFoo: () => ({ bar: "bar" })
      }
    };

    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
      allowBatchedHttpRequests: true,
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
          req = ctx.req;

          return ctx as any;
        }
      })
    );

    request = supertest(app);
  });

  it("should return an empty array when there is no query", async () => {
    await request.post("/graphql").send({});

    expect(req.gqlInfos).toBeUndefined();
  });

  it("should return an empty array when parsing fails", async () => {
    await request.post("/graphql").send({ query: "<?>" });

    expect(req.gqlInfos).toBeUndefined();
  });

  it("should return an empty array when there is no operation", async () => {
    await request.post("/graphql").send({ query: "{}" });

    expect(req.gqlInfos).toBeUndefined();
  });

  it("should return a single operation info", async () => {
    await request.post("/graphql").send({ query: "{ foo { bar } }" });

    expect(req.gqlInfos!.length).toBe(1);
    expect(req.gqlInfos![0].operation).toBe("query");
    expect(req.gqlInfos![0].name).toBe("foo");
  });

  it("should return several operations info", async () => {
    await request.post("/graphql").send({
      query: "query Q { foo { bar } } mutation M { createFoo { bar } }"
    });

    expect(req.gqlInfos!.length).toBe(2);
    expect(req.gqlInfos![0].operation).toBe("query");
    expect(req.gqlInfos![0].name).toBe("foo");
    expect(req.gqlInfos![1].operation).toBe("mutation");
    expect(req.gqlInfos![1].name).toBe("createFoo");
  });
});
