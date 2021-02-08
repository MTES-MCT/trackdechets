import { resetDatabase } from "../../integration-tests/helper";
import { userWithAccessTokenFactory } from "./factories";
import supertest from "supertest";
import { app } from "../server";

const request = supertest(app);

describe("Perform api requests", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  test("query request with application/json header", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();
    console.log(accessToken);
    const res = await request
      .post("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query: "{ me { email }}" });
    console.log(res);
    expect(res.body.data.me.email).toEqual(user.email);
  });

  test("query request with application/graphql header", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();

    const res = await request
      .post("/")
      .type("application/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send("{ me { email }}");

    expect(res.body.data.me.email).toEqual(user.email);
  });
});
