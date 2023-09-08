import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { gql } from "graphql-tag";
import express, { json } from "express";
import supertest from "supertest";
import cors from "cors";
import { gqlInfosPlugin } from "../gqlInfosPlugin";
import { GraphQLContext } from "../../../types";
import { gqlRegenerateSessionPlugin } from "../gqlRegenerateSessionPlugin";
import session from "express-session";

const sess: session.SessionOptions = {
  name: "connect.sid",
  secret: "a secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    domain: "test.local",
    maxAge: 24 * 3600 * 1000
  }
};

describe("gqlRegenerateSessionPlugin", () => {
  let request;

  beforeAll(async () => {
    const app = express();
    app.use(session(sess));

    const typeDefs = gql`
      type Foo {
        bar: String
      }
      type Query {
        foo: Foo
      }
      type Mutation {
        changePassword: Foo
      }
    `;

    const resolvers = {
      Query: {
        foo: () => ({ bar: "bar" })
      },
      Mutation: {
        changePassword: () => ({ bar: "bar" })
      }
    };

    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
      plugins: [
        gqlInfosPlugin(), // We rely on `gqlInfosPlugin`
        gqlRegenerateSessionPlugin(["changePassword"])
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

  it("should send a new session cookie when calling targeted query", async () => {
    const body = { query: "mutation { changePassword { bar } }" };
    const response = await request.post("/graphql").send(body);

    // should send new connect.sid cookie
    expect(response.header["set-cookie"]).toHaveLength(1);
  });

  it("should not send a new session cookie when calling a non targeted query", async () => {
    const body = { query: "{ foo { bar } }" };
    const response = await request.post("/graphql").send(body);

    expect(response.header["set-cookie"]).toBeUndefined();
  });
});
