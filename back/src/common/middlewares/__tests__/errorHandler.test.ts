import express, { json } from "express";
import supertest from "supertest";

const originalConsole = global.console;
global.console = { error: jest.fn() } as any;

afterAll(() => {
  global.console = originalConsole;
});

describe("errorHandler", () => {
  const OLD_ENV = process.env;

  let request;

  function setup() {
    const app = express();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const errorHandler = require("../errorHandler").default;

    app.use(json());

    app.get("/bim", () => {
      throw new Error("Bam Boom");
    });

    app.post("/echo", (req, res) => {
      res.status(200).send(req.body);
    });

    app.use(errorHandler);

    request = supertest(app);
  }

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should not leak error in production", async () => {
    process.env.NODE_ENV = "production";
    setup();
    const response = await request.get("/bim");
    expect(response.status).toEqual(500);
    expect(response.text).toEqual(
      `<!DOCTYPE html>\n` +
        `<html lang="en">\n` +
        `<head>\n` +
        `<meta charset="utf-8">\n` +
        `<title>Error</title>\n` +
        `</head>\n` +
        `<body>\n` +
        `<pre>Internal Server Error</pre>\n` +
        `</body>\n` +
        `</html>\n`
    );
  });

  it("should display error message in development", async () => {
    process.env.NODE_ENV = "dev";
    setup();
    const response = await request.get("/bim");
    expect(response.status).toEqual(500);
    expect(response.text).toContain("Bam Boom");
  });

  it("should tell consumer when JSON is not correctly formatted", async () => {
    process.env.NODE_ENV = "production";
    setup();
    const response = await request
      .post("/echo")
      .set("Content-Type", "application/json")
      .send(`{"query: "{ me { name } }"}`);
    expect(response.status).toEqual(400);
    expect(response.text).toEqual(`{"error":"JSON mal formaté ou invalide"}`);
  });
});
