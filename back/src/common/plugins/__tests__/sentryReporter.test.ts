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

describe("graphqlErrorHandler", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  function setup(queryResolver) {
    const sentryIdSpy = jest.fn();
    const formatErrorMock = jest.fn().mockImplementation(err => {
      sentryIdSpy(err?.originalError?.sentryId);
      return err;
    });

    const app = express();
    const typeDefs = gql`
      type Query {
        bim: String
      }
    `;

    const resolvers = {
      Query: {
        bim: queryResolver
      }
    };

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      formatError: formatErrorMock,
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
    return {
      request: supertest(app),
      formatErrorMock,
      sentryIdSpy
    };
  }

  it("should report unknown errors to sentry and attach sentryId to error", async () => {
    const sentryId = "sentry_id_1";
    captureExceptionSpy.mockReturnValue("sentry_id_1");

    const error = new Error("Bam Boom");
    const { request, sentryIdSpy } = setup(() => {
      throw error;
    });
    await request.post("/graphql").send({ query: "query { bim }" });

    expect(captureExceptionSpy.mock.calls[0][0]).toEqual(error);
    // check sentryId has been attached to the error
    expect(sentryIdSpy).toHaveBeenCalledWith(sentryId);
  });

  it("should not report yup ValidationError", async () => {
    const { request, sentryIdSpy } = setup(() => {
      const yupSchema = yup.object({ foo: yup.number().min(0) });
      // failing yup validation, foo should be positive
      yupSchema.validateSync({ foo: -1 });
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(sentryIdSpy).toHaveBeenCalledWith(undefined);
  });

  it("should not report generic ApolloError", async () => {
    const { request, sentryIdSpy } = setup(() => {
      throw new ApolloError("Bam Boom");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(sentryIdSpy).toHaveBeenCalledWith(undefined);
  });

  it("should not report UserInputError", async () => {
    const { request, sentryIdSpy } = setup(() => {
      throw new UserInputError("Bad input");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(sentryIdSpy).toHaveBeenCalledWith(undefined);
  });

  it("should not report AuthenticationError", async () => {
    const { request, sentryIdSpy } = setup(() => {
      throw new AuthenticationError("authentication failed");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(sentryIdSpy).toHaveBeenCalledWith(undefined);
  });

  it("should not report ForbiddenError", async () => {
    const { request, sentryIdSpy } = setup(() => {
      throw new ForbiddenError("forbidden");
    });
    await request.post("/graphql").send({ query: "query { bim }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(sentryIdSpy).toHaveBeenCalledWith(undefined);
  });

  it("should not report GraphQL validation errors", async () => {
    const { request, sentryIdSpy } = setup(() => null);
    // invalid graphql request
    await request.post("/graphql").send({ query: "query { bim { bam } }" });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(sentryIdSpy).toHaveBeenCalledWith(undefined);
  });
});
