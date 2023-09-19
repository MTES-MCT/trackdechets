import express, { json } from "express";
import supertest from "supertest";
import { ApolloServer } from "@apollo/server";
import { gql } from "graphql-tag";
import { graphqlQueryMergingLimiter } from "../graphqlQueryMergingLimiter";
import { ErrorCode } from "../../errors";
import { MAX_OPERATIONS_PER_REQUEST } from "../../middlewares/graphqlBatchLimiter";
import cors from "cors";
import { expressMiddleware } from "@apollo/server/express4";

const graphQLPath = "/gql";

describe("graphqlQueryMergingLimiter Apollo Plugin", () => {
  let request;

  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeAll(async () => {
    const app = express();
    const typeDefs = gql`
      type Identifier {
        id: String
      }
      type MyFragment {
        name: String!
        group: Identifier
        grouping: Identifier
        groupedIn: Identifier
        synthetizingIn: Identifier
        synthetizing: Identifier
        anotherThing: Identifier
      }
      type Query {
        companyInfos(_id: ID!): MyFragment!
      }
    `;

    const resolvers = {
      Query: {
        companyInfos: (_, { _id }) => ({
          name: "La World Company",
          group: {
            id: "String"
          },
          grouping: {
            id: "String"
          },
          groupedIn: {
            id: "String"
          },
          synthetizingIn: {
            id: "String"
          },
          synthetizing: {
            id: "String"
          },
          anotherThing: {
            id: "String"
          }
        })
      }
    };

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      allowBatchedHttpRequests: true,
      plugins: [graphqlQueryMergingLimiter()]
    });

    await server.start();

    app.use(
      graphQLPath,
      cors({
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true
      }),
      json(),
      expressMiddleware(server)
    );

    request = supertest(app);
  });

  it("should allow query merging that respect the batch limit", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "{\n" +
        "  _34035399400023: companyInfos(_id: 34035399400023) { name }\n" +
        "  _20002305900112: companyInfos(_id: 20002305900112) { name }\n" +
        "  _20002305900113: companyInfos(_id: 20002305900113) { name }\n" +
        "  _53063610900429: companyInfos(_id: 53063610900429) { name }\n" +
        "  _18008901307630: companyInfos(_id: 18008901307630) { name }\n" +
        "}\n"
    });
    expect(response.status).toEqual(200);
  });

  it("should fail if query merging has more than MAX_OPERATIONS_PER_REQUEST operations", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "{\n" +
        "  _34035399400023: companyInfos(_id: 34035399400023) { name }\n" +
        "  _20002305900112: companyInfos(_id: 20002305900112) { name }\n" +
        "  _20002305900113: companyInfos(_id: 20002305900113) { name }\n" +
        "  _53063610900429: companyInfos(_id: 53063610900429) { name }\n" +
        "  _18008901307630: companyInfos(_id: 18008901307630) { name }\n" +
        "  _53063610900427: companyInfos(_id: 53063610900427) { name }\n" +
        "}\n"
    });
    expect(response.status).toEqual(400);
    const [e, _rest] = response.body.errors;
    expect(e.extensions.code).toEqual(ErrorCode.GRAPHQL_MAX_OPERATIONS_ERROR);
    expect(e.message).toContain(
      `Batching by query merging is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per query.`
    );
  });

  it("should allow a query with a gql fragments but less than MAX_OPERATIONS_PER_REQUEST queries", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "fragment FullFragment on MyFragment {\n" +
        "  grouping {\n" +
        "    id\n" +
        "  }\n" +
        "  groupedIn {\n" +
        "    id\n" +
        "  }\n" +
        "  group {\n" +
        "    id\n" +
        "  }\n" +
        "  synthetizingIn {\n" +
        "    id\n" +
        "  }\n" +
        "  synthetizing {\n" +
        "    id\n" +
        "  }\n" +
        "  anotherThing {\n" +
        "    id\n" +
        "  }\n" +
        "}\n" +
        "query {\n" +
        "  _34035399400023: companyInfos(_id: 34035399400023) { ...FullFragment }\n" +
        "  _20002305900112: companyInfos(_id: 20002305900112) { ...FullFragment }\n" +
        "  _20002305900113: companyInfos(_id: 20002305900113) { ...FullFragment }\n" +
        "  _53063610900429: companyInfos(_id: 53063610900429) { ...FullFragment }\n" +
        "  _18008901307630: companyInfos(_id: 18008901307630) { ...FullFragment }\n" +
        "}\n"
    });
    expect(response.status).toEqual(200);
  });

  it("should fail a query with a gql fragments but more than MAX_OPERATIONS_PER_REQUEST queries", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "fragment FullFragment on MyFragment {\n" +
        "  grouping {\n" +
        "    id\n" +
        "  }\n" +
        "  groupedIn {\n" +
        "    id\n" +
        "  }\n" +
        "  group {\n" +
        "    id\n" +
        "  }\n" +
        "  synthetizingIn {\n" +
        "    id\n" +
        "  }\n" +
        "  synthetizing {\n" +
        "    id\n" +
        "  }\n" +
        "  anotherThing {\n" +
        "    id\n" +
        "  }\n" +
        "}\n" +
        "query {\n" +
        "  _34035399400023: companyInfos(_id: 34035399400023) { ...FullFragment }\n" +
        "  _20002305900112: companyInfos(_id: 20002305900112) { ...FullFragment }\n" +
        "  _20002305900113: companyInfos(_id: 20002305900113) { ...FullFragment }\n" +
        "  _53063610900429: companyInfos(_id: 53063610900429) { ...FullFragment }\n" +
        "  _18008901307630: companyInfos(_id: 18008901307630) { ...FullFragment }\n" +
        "  _53063610900427: companyInfos(_id: 53063610900427) { name }\n" +
        "}\n"
    });
    expect(response.status).toEqual(400);
    const [e, _rest] = response.body.errors;
    expect(e.extensions.code).toEqual(ErrorCode.GRAPHQL_MAX_OPERATIONS_ERROR);
    expect(e.message).toContain(
      `Batching by query merging is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per query.`
    );
  });

  it("should allow a named query with less queries than MAX_OPERATIONS_PER_REQUEST inside", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "query GetManyCompanyAtOnce {\n" +
        "  _34035399400023: companyInfos(_id: 34035399400023) { name }\n" +
        "  _20002305900112: companyInfos(_id: 20002305900112) { name }\n" +
        "  _20002305900113: companyInfos(_id: 20002305900113) { name }\n" +
        "  _53063610900429: companyInfos(_id: 53063610900429) { name }\n" +
        "  _18008901307630: companyInfos(_id: 18008901307630) { name }\n" +
        "}\n"
    });
    expect(response.status).toEqual(200);
  });

  it("should fail a named query with more queries than MAX_OPERATIONS_PER_REQUEST inside", async () => {
    const response = await request.post(graphQLPath).send({
      query:
        "query GetManyCompanyAtOnce {\n" +
        "  _34035399400023: companyInfos(_id: 34035399400023) { name }\n" +
        "  _20002305900112: companyInfos(_id: 20002305900112) { name }\n" +
        "  _20002305900113: companyInfos(_id: 20002305900113) { name }\n" +
        "  _53063610900429: companyInfos(_id: 53063610900429) { name }\n" +
        "  _18008901307630: companyInfos(_id: 18008901307630) { name }\n" +
        "  _53063610900427: companyInfos(_id: 53063610900427) { name }\n" +
        "}\n"
    });
    expect(response.status).toEqual(400);
  });
});
