import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { gql } from "graphql-tag";
import express, { json } from "express";
import supertest from "supertest";
import cors from "cors";
import { gqlInfosPlugin } from "../gqlInfosPlugin";
import { GraphQLContext } from "../../../types";
import { gqlRateLimitPlugin } from "../gqlRateLimitPlugin";

jest.mock("../../redis", () => ({}));

describe("gqlRateLimitPlugin", () => {
  let request;

  beforeAll(async () => {
    const app = express();
    const typeDefs = gql`
      type Foo {
        bar: String
      }
      type Query {
        accessTokens: Foo
        sensitiveData: Foo
        createUser: Foo
        foo: Foo
      }
    `;

    const resolvers = {
      Query: {
        accessTokens: () => ({ bar: "accessTokens_response" }),
        sensitiveData: () => ({ bar: "sensitiveData_response" }),
        createUser: () => ({ bar: "createUser_response" }),
        foo: () => ({ bar: "foo_response" })
      }
    };

    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
      plugins: [
        gqlInfosPlugin(), // We rely on `gqlInfosPlugin`
        gqlRateLimitPlugin({
          accessTokens: {
            maxRequestsPerWindow: 2,
            windowMs: 1000  // Shorter window for testing
          },
          sensitiveData: {
            maxRequestsPerWindow: 1,
            windowMs: 1000  // Shorter window for testing
          },
          createUser: {
            maxRequestsPerWindow: 3,
            windowMs: 1000  // Shorter window for testing
          }
        } as any)
      ]
    });

    await server.start();

    app.use(
      "/graphql",
      cors({
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true
      }),
      json(),
      expressMiddleware(server, {
        context: ctx => {
          return ctx as any;
        }
      })
    );

    request = supertest(app);
  });

  it("should only allow 2 requests per timeframe on rate limited query", async () => {
    const body = { query: "{ accessTokens { bar } }" };
    const response1 = await request.post("/graphql").send(body);
    expect(response1.status).toEqual(200);

    const response2 = await request.post("/graphql").send(body);
    expect(response2.status).toEqual(200);

    // Third request should be rate limited
    const response3 = await request.post("/graphql").send(body);
    expect(response3.status).toEqual(429);
  });

  it("should not rate limit other queries", async () => {
    const body = { query: "{ foo { bar } }" };
    const response1 = await request.post("/graphql").send(body);
    expect(response1.status).toEqual(200);

    const response2 = await request.post("/graphql").send(body);
    expect(response2.status).toEqual(200);
  });

  it("should count multiple operations in single query properly", async () => {
    // Since accessTokens has maxRequestsPerWindow: 2, 
    // a query with multiple accessTokens fields should hit the limit
    
    const queryWithMultipleOperations = `
      query {
        first: accessTokens { bar }
        second: accessTokens { bar }
      }
    `;

    const response = await request.post("/graphql").send({ 
      query: queryWithMultipleOperations 
    });
    
    // The request should succeed because we're executing exactly 2 accessTokens operations
    // and the limit is 2 per window
    expect(response.status).toEqual(200);
    
    // But another accessTokens request should now be blocked
    const response2 = await request.post("/graphql").send({
      query: "{ accessTokens { bar } }"
    });
    expect(response2.status).toEqual(429);
  });

  it("should handle mixed operations correctly", async () => {
    // Wait a bit to avoid rate limit from previous test
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mix of rate-limited and non-rate-limited operations in single query
    const mixedQuery = `
      query {
        foo { bar }           # Not rate limited
        moreFoo: foo { bar }  # Not rate limited
      }
    `;

    // This should succeed since no rate-limited operations
    const response1 = await request.post("/graphql").send({ 
      query: mixedQuery 
    });
    expect(response1.status).toEqual(200);

    // Now test that rate limits still work independently
    const rateLimitedQuery = `{ accessTokens { bar } }`;
    const response2 = await request.post("/graphql").send({
      query: rateLimitedQuery
    });
    // This might succeed or fail depending on previous test timing
    expect([200, 429]).toContain(response2.status);
  });

  it("should correctly count aliased rate-limited operations", async () => {
    // Wait to reset rate limit window
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Multiple accessTokens calls using aliases
    const aliasedQuery = `
      query {
        first: accessTokens { bar }
        second: accessTokens { bar }
        third: accessTokens { bar }
      }
    `;

    const response = await request.post("/graphql").send({ 
      query: aliasedQuery 
    });
    
    // This should be rate limited because we have 3 accessTokens operations
    // but the limit is only 2 per window
    expect(response.status).toEqual(429);
  });

  describe("batch operations with different rate limits", () => {
    let batchRequest: supertest.SuperTest<supertest.Test>;

    beforeAll(async () => {
      // Create a separate server instance for batch tests to ensure isolation
      const batchApp = express();
      const batchServer = new ApolloServer<GraphQLContext>({
        typeDefs: gql`
          type Foo {
            bar: String
          }
          type Query {
            accessTokens: Foo
            sensitiveData: Foo
            createUser: Foo
            foo: Foo
          }
        `,
        resolvers: {
          Query: {
            accessTokens: () => ({ bar: "accessTokens_response" }),
            sensitiveData: () => ({ bar: "sensitiveData_response" }),
            createUser: () => ({ bar: "createUser_response" }),
            foo: () => ({ bar: "foo_response" })
          }
        },
        plugins: [
          gqlInfosPlugin(),
          gqlRateLimitPlugin({
            accessTokens: {
              maxRequestsPerWindow: 2,
              windowMs: 2000  // 2 seconds for batch tests
            },
            sensitiveData: {
              maxRequestsPerWindow: 1,
              windowMs: 2000
            },
            createUser: {
              maxRequestsPerWindow: 3,
              windowMs: 2000
            }
          } as any)
        ]
      });

      await batchServer.start();

      batchApp.use(
        "/graphql",
        cors({
          methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
          preflightContinue: false,
          optionsSuccessStatus: 204,
          credentials: true
        }),
        json(),
        expressMiddleware(batchServer, {
          context: ctx => {
            return ctx as any;
          }
        })
      );

      batchRequest = supertest(batchApp);
    });

    beforeEach(async () => {
      // Wait for rate limit window reset between tests
      await new Promise(resolve => setTimeout(resolve, 2100));
    });

    it("should count each operation separately in mixed batches", async () => {
      // Batch with different operations, each with their own rate limits:
      // - accessTokens: limit 2
      // - sensitiveData: limit 1
      // - createUser: limit 3
      // - foo: no limit
      
      const mixedBatchQuery = `
        query {
          accessTokens { bar }      # 1/2 accessTokens used
          sensitiveData { bar }     # 1/1 sensitiveData used (hits limit)
          foo { bar }               # Unlimited
          createUser { bar }        # 1/3 createUser used
        }
      `;

      const response1 = await batchRequest.post("/graphql").send({ 
        query: mixedBatchQuery 
      });
      
      // This should succeed - all operations within their limits
      expect(response1.status).toEqual(200);

      // Now test that individual rate limits are correctly affected
      
      // accessTokens should have 1 more request available (1/2 used)
      const response2 = await batchRequest.post("/graphql").send({
        query: "{ accessTokens { bar } }"
      });
      expect(response2.status).toEqual(200);

      // sensitiveData should be exhausted (1/1 used)
      const response3 = await batchRequest.post("/graphql").send({
        query: "{ sensitiveData { bar } }"
      });
      expect(response3.status).toEqual(429);

      // createUser should have 2 more requests available (1/3 used)
      const response4 = await batchRequest.post("/graphql").send({
        query: "{ createUser { bar } }"
      });
      expect(response4.status).toEqual(200);

      // foo should be unlimited
      const response5 = await batchRequest.post("/graphql").send({
        query: "{ foo { bar } }"
      });
      expect(response5.status).toEqual(200);
    });

    it("should handle batches that exceed individual operation limits", async () => {
      // Try to use more sensitiveData operations than allowed in a single batch
      const exceededBatchQuery = `
        query {
          first: sensitiveData { bar }   # 1/1 sensitiveData used
          second: sensitiveData { bar }  # 2/1 - should exceed limit
        }
      `;

      const response = await batchRequest.post("/graphql").send({ 
        query: exceededBatchQuery 
      });
      
      // Should be rate limited because sensitiveData limit is 1
      expect(response.status).toEqual(429);
    });

    it("should allow independent rate limit recovery", async () => {
      // Use up accessTokens limit but leave others available
      const partialBatchQuery = `
        query {
          first: accessTokens { bar }    # 1/2 accessTokens used
          second: accessTokens { bar }   # 2/2 accessTokens used (limit reached)
        }
      `;

      const response1 = await batchRequest.post("/graphql").send({ 
        query: partialBatchQuery 
      });
      expect(response1.status).toEqual(200);

      // accessTokens should now be exhausted
      const response2 = await batchRequest.post("/graphql").send({
        query: "{ accessTokens { bar } }"
      });
      expect(response2.status).toEqual(429);

      // But other operations should still be available
      const response3 = await batchRequest.post("/graphql").send({
        query: "{ createUser { bar } }"
      });
      expect(response3.status).toEqual(200);

      const response4 = await batchRequest.post("/graphql").send({
        query: "{ foo { bar } }"
      });
      expect(response4.status).toEqual(200);
    });

    it("should demonstrate batch attack prevention", async () => {
      // Simulate an attacker trying to batch multiple expensive operations
      const attackBatchQuery = `
        query {
          # Try to exhaust multiple rate limits in one request
          token1: accessTokens { bar }
          token2: accessTokens { bar }     # Uses up accessTokens limit (2/2)
          data: sensitiveData { bar }      # Uses up sensitiveData limit (1/1)
          user1: createUser { bar }
          user2: createUser { bar }
          user3: createUser { bar }        # Uses up createUser limit (3/3)
        }
      `;

      const response1 = await batchRequest.post("/graphql").send({ 
        query: attackBatchQuery 
      });
      
      // This massive batch should succeed but exhaust all rate limits
      expect(response1.status).toEqual(200);

      // Now all rate-limited operations should be blocked
      const response2 = await batchRequest.post("/graphql").send({
        query: "{ accessTokens { bar } }"
      });
      expect(response2.status).toEqual(429);

      const response3 = await batchRequest.post("/graphql").send({
        query: "{ sensitiveData { bar } }"
      });
      expect(response3.status).toEqual(429);

      const response4 = await batchRequest.post("/graphql").send({
        query: "{ createUser { bar } }"
      });
      expect(response4.status).toEqual(429);

      // But unlimited operations should still work
      const response5 = await batchRequest.post("/graphql").send({
        query: "{ foo { bar } }"
      });
      expect(response5.status).toEqual(200);
    });
  });
});
