import express from "express";
import supertest from "supertest";
import { ApolloServer, gql } from "apollo-server-express";
import { graphqlQueryMergingLimiter } from "../graphqlQueryMergingLimiter";
import { ErrorCode } from "../../errors";
import { MAX_OPERATIONS_PER_REQUEST } from "../graphqlBatchLimiter";

const graphQLPath = "/gql";
const mockResolver = jest.fn();

describe("graphqlQueryMergingLimiter Apollo Plugin", () => {
  let request;

  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeAll(async () => {
    const app = express();
    const typeDefs = gql`
      type Query {
        companyInfos: String
      }
    `;

    const resolvers = {
      Query: {
        companyInfos: mockResolver
      }
    };

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [graphqlQueryMergingLimiter()]
    });

    await server.start();

    server.applyMiddleware({
      app,
      cors: {
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true
      },
      path: graphQLPath
    });

    request = supertest(app);
  });

  it("should allow query merging that respect the batch limit", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "{\n" +
        "  _34035399400023: companyInfos\n" +
        "  _20002305900112: companyInfos\n" +
        "  _26030017300010: companyInfos\n" +
        "  _53063610900429: companyInfos\n" +
        "  _18008901307630: companyInfos\n" +
        "}\n"
    });
    expect(response.status).toEqual(200);
  });

  it("should fail if query merging has more than MAX_OPERATIONS_PER_REQUEST operations", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "{\n" +
        "  _34035399400023: companyInfos\n" +
        "  _20002305900112: companyInfos\n" +
        "  _26030017300010: companyInfos\n" +
        "  _53063610900429: companyInfos\n" +
        "  _18008901307630: companyInfos\n" +
        "  _53063610900427: companyInfos\n" +
        "}\n"
    });
    expect(response.status).toEqual(400);
    const [e, _rest] = response.body.errors;
    expect(e.extensions.code).toEqual(ErrorCode.GRAPHQL_MAX_OPERATIONS_ERROR);
    expect(e.message).toContain(
      `Batching by query merging is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per query.`
    );
  });
});
