import {
  ApolloError,
  ApolloServer,
  AuthenticationError,
  ForbiddenError,
  gql,
  UserInputError
} from "apollo-server-express";
import express from "express";
import * as Sentry from "@sentry/node";
import supertest from "supertest";
import * as yup from "yup";
import sentryReporter from "../sentryReporter";

const captureExceptionSpy = jest.spyOn(Sentry, "captureException");
const mockResolver = jest.fn();
const mockFormatError = jest.fn();

describe("graphqlErrorHandler", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const app = express();
  const typeDefs = gql`
    type Query {
      bim: String
    }
  `;

  const resolvers = {
    Query: {
      bim: mockResolver
    }
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: mockFormatError,
    plugins: [sentryReporter]
  });

  server.applyMiddleware({
    app,
    cors: {
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    },
    path: "/graphql"
  });

  const request = supertest(app);

  it("should report unknown errors to sentry and attach sentryId to error", async () => {
    const sentryId = "sentry_id_1";
    captureExceptionSpy.mockReturnValue("sentry_id_1");

    const error = new Error("Bam Boom");
    mockResolver.mockImplementation(() => {
      throw error;
    });
    await request.post("/graphql").send({ query: "query { bim }" });

    // check error has been captured
    expect(captureExceptionSpy.mock.calls[0][0]).toEqual(error);
    // check sentryId has been set
    const finalError = mockFormatError.mock.calls[0][0];
    expect(finalError.originalError.sentryId).toEqual(sentryId);
  });

  it("should not report yup ValidationError", async () => {
    mockResolver.mockImplementation(() => {
      const yupSchema = yup.object({ foo: yup.number().min(0) });
      // failing yup validation, foo should be positive
      yupSchema.validateSync({ foo: -1 });
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
  });

  it("should not report generic ApolloError", async () => {
    mockResolver.mockImplementation(() => {
      throw new ApolloError("Bam Boom");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
  });

  it("should not report UserInputError", async () => {
    mockResolver.mockImplementation(() => {
      throw new UserInputError("Bad input");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
  });

  it("should not report AuthenticationError", async () => {
    mockResolver.mockImplementation(() => {
      throw new AuthenticationError("authentication failed");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
  });

  it("should not report ForbiddenError", async () => {
    mockResolver.mockImplementation(() => {
      throw new ForbiddenError("forbidden");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
  });

  it("should not report GraphQL validation errors", async () => {
    mockResolver.mockImplementation(() => {
      return "OK";
    });
    // invalid graphql request, bam does not exist
    await request.post("/graphql").send({ query: "query { bim { bam } }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
  });
});
