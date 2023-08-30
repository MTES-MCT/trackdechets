import express, { json } from "express";
import supertest from "supertest";
import logger from "../../../logging/logger";
import { graphqlQueryParserMiddleware } from "../graphqlQueryParser";
import loggingMiddleware from "../loggingMiddleware";
import { graphqlBodyParser } from "../graphqlBodyParser";

describe("graphqlBodyParser", () => {
  const app = express();
  const graphQLPath = "/";
  app.use(json());
  app.use(graphQLPath, graphqlBodyParser);

  app.get("/hello", (req, res) => {
    res.status(200).send("world");
  });
  app.post(graphQLPath, (req, res) => {
    // Return body
    res.status(200).send({ reqBody: req.body });
  });

  const request = supertest(app);

  it("should convert JSON encoded variables to JSON", async () => {
    const response = await request
      .post(graphQLPath)
      .send({ query: "{ __typename }", variables: '{ "foo": 1 }' });

    expect(response.body.reqBody.variables.foo).toBe(1);
  });

  it("should convert application/graphql requests", async () => {
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/graphql")
      .send("{ __typename }");

    expect(response.body.reqBody.query).toBe("{ __typename }");
  });
});
