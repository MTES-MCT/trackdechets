import { Request, Response } from "express";
import { graphqlQueryParserMiddleware } from "../graphqlQueryParser";

describe("graphqlQueryParserMiddleware", () => {
  const middleware = graphqlQueryParserMiddleware();
  const res = {} as Response;
  const next = () => null;

  it("should return an empty array when there is no query", async () => {
    const req = {} as Request;
    middleware(req, res, next);

    expect(req.gqlInfos).toEqual([]);
  });

  it("should return an empty array when parsing fails", async () => {
    const req = { body: { query: "<?>" } } as Request;
    middleware(req, res, next);

    expect(req.gqlInfos).toEqual([]);
  });

  it("should return an empty array when there is no operation", async () => {
    const req = { body: { query: "{}" } } as Request;
    middleware(req, res, next);

    expect(req.gqlInfos).toEqual([]);
  });

  it("should return a single operation info", async () => {
    const req = { body: { query: "{me {id}}" } } as Request;
    middleware(req, res, next);

    expect(req.gqlInfos.length).toBe(1);
    expect(req.gqlInfos[0].operation).toBe("query");
    expect(req.gqlInfos[0].name).toBe("me");
  });

  it("should return several operations info", async () => {
    const req = {
      body: { query: "query { me { id } } mutation { sign { id } }" }
    } as Request;
    middleware(req, res, next);

    expect(req.gqlInfos.length).toBe(2);
    expect(req.gqlInfos[0].operation).toBe("query");
    expect(req.gqlInfos[0].name).toBe("me");
    expect(req.gqlInfos[1].operation).toBe("mutation");
    expect(req.gqlInfos[1].name).toBe("sign");
  });
});
