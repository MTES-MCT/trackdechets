import express, { json, Express } from "express";
import supertest, { SuperTest, Test } from "supertest";
import sanitizePathBodyMiddleware from "../sanitizePathBody";

// GraphQL endpoint
const graphQLPath = "/";

describe("sanitizePathBodyMiddleware", () => {
  let request: SuperTest<Test>;
  let app: Express;

  function setupTestApp() {
    app = express();
    app.use(json());
    app.use(sanitizePathBodyMiddleware(graphQLPath));
  }

  beforeEach(() => {
    jest.resetModules();
  });

  it("should not modify valid graphql response", async () => {
    setupTestApp();
    /**
     * Good JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        good: "oué",
        nested: {
          is: 4
        }
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.good).toEqual("oué");
    expect(body.nested.is).toEqual(4);
  });

  it("should not apply to endpoint other than graphql", async () => {
    setupTestApp();
    /**
     * Excluded endpoint path
     */
    app.get("/else", (req, res) =>
      res.json({
        is: true,
        good: "<script>oué"
      })
    );

    request = supertest(app);
    const { body } = await request.get("/else");
    expect(body.is).toEqual(true);
    expect(body.good).toEqual("<script>oué");
  });

  it("should remove <script> tag in json response", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "json",
        bad: "<script>oué</script>"
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad).toEqual("oué");
  });

  it("should remove <script> tag in string with res.send", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) => res.send("<script>oué</script>"));
    request = supertest(app);
    const { text } = await request.get(graphQLPath);
    expect(text).toEqual("oué");
  });

  it("should not apply to res.end response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) => res.end("<script>oué</script>"));
    request = supertest(app);
    const { text } = await request.get(graphQLPath);
    expect(text).toEqual("<script>oué</script>");
  });

  it("should remove <script> tag in Buffer response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) =>
      res.send(Buffer.from("<script>oué</script>"))
    );
    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body).toEqual(Buffer.from("oué"));
  });

  it("should remove <script> tag in array response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) => res.send(["<script>oué</script>"]));
    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body[0]).toEqual("oué");
  });

  it("should remove <script> tag in object response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) =>
      res.send({ bad: "<script>oué</script>", type: "object" })
    );
    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.bad).toEqual("oué");
  });

  it("should remove forbidden opening tag only", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "json",
        bad: "<script>yes"
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad).toEqual("yes");
  });

  it("should handle nested tags", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "nestedtags",
        bad: "<sc<script></script>ript>alert(1)</script>"
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad).toEqual("&lt;script&gt;alert(1)");
  });

  it("should handle nested variables", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "nested",
        bad: {
          nested: "<script></script>bar"
        }
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad.nested).toEqual("bar");
  });
});
