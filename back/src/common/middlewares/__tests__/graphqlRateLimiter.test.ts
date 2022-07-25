import express, { json } from "express";
import supertest from "supertest";
import { graphqlQueryParserMiddleware } from "../graphqlQueryParser";
import { graphqlRateLimiterMiddleware } from "../graphqlRatelimiter";

const graphQLPath = "/gql";

describe("graphqlRateLimiterMiddleware", () => {
  const app = express();
  app.use(json());
  app.use(graphQLPath, graphqlQueryParserMiddleware()); // We rely on `graphqlQueryParserMiddleware`
  app.use(
    graphQLPath,
    graphqlRateLimiterMiddleware("resendInvitation", {
      maxRequestsPerWindow: 1,
      windowMs: 10000
    })
  );
  app.post(graphQLPath, (req, res) => {
    res.status(200).send(req.body);
  });
  const request = supertest(app);

  it("should only allow 1 request per timeframe on rate limited query", async () => {
    const body = JSON.stringify({ query: "{resendInvitation { id } }" });
    const response1 = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response1.status).toEqual(200);

    const response2 = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response2.status).toEqual(429);
  });

  it("should not rate limite other queries", async () => {
    const body = JSON.stringify({ query: "{otherQuery { id } }" });
    const response1 = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response1.status).toEqual(200);

    const response2 = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response2.status).toEqual(200);
  });
});
