import { resetDatabase } from "../../integration-tests/helper";
import { userWithAccessTokenFactory } from "./factories";
import supertest from "supertest";
import { app } from "../server";

const request = supertest(app);

describe("Perform api requests", () => {
  afterEach(resetDatabase);

  test("query request with application/json header", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();
    const res = await request
      .post("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query: "{ me { email }}" });
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

  it("should sanitize graphql responses", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory({
      name: "<script>Rich",
      email: "<script>yes</script>"
    });
    const { body } = await request
      .post("/")
      .type("application/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send("{ me { id, isAdmin, email, name }}");

    expect(body.data.me.id).toEqual(user.id);
    expect(body.data.me.name).toEqual("Rich");
    expect(body.data.me.email).toEqual("yes");
    expect(body.data.me.isAdmin).toEqual(false);
  });

  it("should allow batch operations", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();

    const res = await request
      .post("/")
      .type("application/json")
      .set("Authorization", `Bearer ${accessToken}`)
      .send([{ query: "{ me { email }}" }]);

    expect(res.body[0].data.me.email).toEqual(user.email);
  });

  it("should limit the number of possible batch operations", async () => {
    const { accessToken } = await userWithAccessTokenFactory();

    const res = await request
      .post("/")
      .type("application/json")
      .set("Authorization", `Bearer ${accessToken}`)
      .send([...Array(10)].map(_ => ({ query: "{ me { email }}" })));

    expect(res.body.error).toEqual(
      "Batching is limited to 5 operations per request."
    );
  });
});
