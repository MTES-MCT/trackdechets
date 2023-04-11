import express from "express";
import supertest from "supertest";
import { ApolloServer, gql } from "apollo-server-express";
import { graphqlQueryMergingLimiter } from "../graphqlQueryMergingLimiter";

const graphQLPath = "/gql";
const mockResolver = jest.fn();
const mockFormatError = jest.fn();

describe("graphqlBatchLimiterMiddleware", () => {
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
      formatError: mockFormatError,
      plugins: [graphqlQueryMergingLimiter]
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
        '  _34035399400023: companyInfos(siret: "34035399400023") {\n' +
        "  }\n" +
        '  _20002305900112: companyInfos(siret: "20002305900112") {\n' +
        "  }\n" +
        '  _26030017300010: companyInfos(siret: "26030017300010") {\n' +
        "  }\n" +
        '  _53063610900429: companyInfos(siret: "53063610900429") {\n' +
        "  }\n" +
        '  _18008901307630: companyInfos(siret: "18008901307630") {\n' +
        "  }\n" +
        "}\n"
    });
    expect(response.status).toEqual(200);
  });

  it("should fail if query merging has too many operations", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "{\n" +
        '  _34035399400023: companyInfos(siret: "34035399400023") {\n' +
        "  }\n" +
        '  _20002305900112: companyInfos(siret: "20002305900112") {\n' +
        "  }\n" +
        '  _26030017300010: companyInfos(siret: "26030017300010") {\n' +
        "  }\n" +
        '  _53063610900429: companyInfos(siret: "53063610900429") {\n' +
        "  }\n" +
        '  _18008901307630: companyInfos(siret: "18008901307630") {\n' +
        "  }\n" +
        '  _18008901307631: companyInfos(siret: "18008901307631") {\n' +
        "  }\n" +
        "}\n"
    });
    expect(response.status).toEqual(400);
    const { error } = JSON.parse(response.text) as any;
    expect(error).toContain(
      "Batching by query merging is limited to 5 operations per query."
    );
  });
});
