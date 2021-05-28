import supertest from "supertest";
import { app } from "../server";

const request = supertest(app);

describe("Express server", () => {
  it("should return 404 Not Found when performing get request on an unkown route", async () => {
    const response = await request.get("/does/not/exist");
    expect(response.status).toEqual(404);
    expect(response.text).toEqual("Not found");
  });

  it("should return 404 Not Found when performing a post request on an unkown route", async () => {
    const response = await request.post("/does/not/exist");
    expect(response.status).toEqual(404);
    expect(response.text).toEqual("Not found");
  });

  it("should return apollo health check", async () => {
    const response = await request
      .get("/.well-known/apollo/server-health")
      .query({ foo: "bar" });
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ status: "pass" });
  });
});
