import express, { json } from "express";
import supertest from "supertest";
import { graphqlBatchLimiterMiddleware } from "../graphqlBatchLimiter";

const graphQLPath = "/gql";

describe("graphqlBatchLimiterMiddleware", () => {
  const app = express();
  app.use(json());
  app.use(graphQLPath, graphqlBatchLimiterMiddleware());
  app.post(graphQLPath, (req, res) => {
    res.status(200).send(req.body);
  });
  const request = supertest(app);

  it("should allow object requests", async () => {
    const body = JSON.stringify({ foo: "bar" });
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(200);
  });

  it("should allow array requests that respect the batch limit", async () => {
    const body = JSON.stringify([{ foo: "bar" }]);
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(200);
  });

  it("should fail if batching has too many operations", async () => {
    const body = JSON.stringify([...Array(10)].map(_ => ({ foo: "bar" })));
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(
      "Batching is limited to 5 operations per request."
    );
  });
});
