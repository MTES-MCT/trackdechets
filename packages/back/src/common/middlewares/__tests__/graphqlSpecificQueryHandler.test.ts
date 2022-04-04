import { Request, Response } from "express";
import { graphqlSpecificQueryHandlerMiddleware } from "../graphqlSpecificQueryHandler";

describe("graphqlQueryParserMiddleware", () => {
  const targetQuery = "apiKey";
  const mockFn = jest.fn();
  const middleware = graphqlSpecificQueryHandlerMiddleware(targetQuery, mockFn);
  const res = {} as Response;
  const next = () => null;

  afterEach(() => mockFn.mockReset());

  it("should not call middleware if the query is not targetted by the middleware", async () => {
    const req = {
      gqlInfos: [{ operation: "query", name: "anotherQuery" }]
    } as Request;
    middleware(req, res, next);

    expect(mockFn).not.toHaveBeenCalled();
  });

  it("should call middleware if the query is targetted by the middleware", async () => {
    const req = {
      gqlInfos: [{ operation: "query", name: targetQuery }]
    } as Request;
    middleware(req, res, next);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should call middleware if the query is one of the targetted queries by the middleware", async () => {
    const req = {
      gqlInfos: [
        { operation: "mutation", name: "iMutate" },
        { operation: "query", name: targetQuery }
      ]
    } as Request;
    middleware(req, res, next);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
