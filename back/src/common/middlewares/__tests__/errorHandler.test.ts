import * as express from "express";
import * as supertest from "supertest";

describe("errorHandler", () => {
  const OLD_ENV = process.env;

  let request = null;

  function setup() {
    const app = express();
    const errorHandler = require("../errorHandler").default;
    app.use(() => {
      throw new Error("Bang");
    });
    app.get("/hello", (_req, res) => {
      res.status(200).send("world");
    });
    app.use(errorHandler);

    request = supertest(app);
  }

  beforeEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should not leak error in production", async () => {
    process.env.NODE_ENV = "production";
    setup();
    const response = await request.get("/hello");
    expect(response.status).toEqual(500);
    expect(response.text).toEqual("Erreur serveur");
    expect(true).toBe(true);
  });

  it("should display error message in development", async () => {
    process.env.NODE_ENV = "dev";
    setup();
    const response = await request.get("/hello");
    expect(response.status).toEqual(500);
    expect(response.text).toContain("Bang");
  });
});
