import express, { json } from "express";
import session from "express-session";
import supertest from "supertest";
import { graphqlQueryParserMiddleware } from "../graphqlQueryParser";
import { graphqlRegenerateSessionMiddleware } from "../graphqlRegenerateSession";

const graphQLPath = "/gql";
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

describe("graphqlRegenerateSessionMiddleware", () => {
  const app = express();
  app.use(json());
  app.use(graphQLPath, graphqlQueryParserMiddleware()); // We rely on `graphqlQueryParserMiddleware`
  app.use(session(sess));
  app.use(graphQLPath, graphqlRegenerateSessionMiddleware("changePassword"));
  app.post(graphQLPath, (req, res) => {
    res.status(200).send(req.body);
  });
  const request = supertest(app);

  it("should send a new session cookie when calling targetted query", async () => {
    const body = JSON.stringify({ query: "{ changePassword { id } }" });
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);

    // should send new connect.sid cookie
    expect(response.header["set-cookie"]).toHaveLength(1);
  });

  it("should not send a new session cookie when calling a non targetted query", async () => {
    const body = JSON.stringify({ query: "{ otherQuery { id } }" });
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);

    expect(response.header["set-cookie"]).toBeUndefined();
  });
});
