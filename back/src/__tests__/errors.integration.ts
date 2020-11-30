import { createTestClient } from "apollo-server-testing";
import { UserInputError, ApolloError } from "apollo-server-express";
import { readFileSync } from "fs";
import { ValidationError } from "yup";
import { ErrorCode } from "../common/errors";

const mockFoo = jest.fn();
const mockBar = jest.fn();

jest.mock("../schema.ts", () => ({
  typeDefs: `
    type Query {
      foo: String
    }
    type Mutation {
      bar(input: String!): String!
    }
  `,
  resolvers: {
    Query: {
      foo: () => mockFoo()
    },
    Mutation: {
      bar: () => mockBar()
    }
  },
  shieldRulesTree: {}
}));

const FOO = `query { foo }`;
const BAR = `
  mutation Bar($input: String!){
    bar(input: $input)
  }
`;

describe("Error handling", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    mockFoo.mockReset();
  });

  test("errors should be null if query resolve correctly", async () => {
    process.env.NODE_ENV = "production";
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockResolvedValueOnce("bar");
    const { errors, data } = await query({ query: FOO });
    expect(errors).toBeUndefined();
    expect(data).toEqual({ foo: "bar" });
  });

  test("subclasses of Apollo errors should be formatted correctly when thrown", async () => {
    process.env.NODE_ENV = "production";
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockImplementationOnce(() => {
      throw new UserInputError("Oups");
    });
    const { errors } = await query({ query: FOO });
    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error.message).toEqual("Oups");
    expect(error.extensions.code).toEqual("BAD_USER_INPUT");
  });

  test("subclasses of Apollo errors should be formatted correctly when returned", async () => {
    process.env.NODE_ENV = "production";
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockImplementationOnce(() => {
      return new UserInputError("Oups");
    });
    const { errors } = await query({ query: FOO });
    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error.message).toEqual("Oups");
    expect(error.extensions.code).toEqual("BAD_USER_INPUT");
  });

  test("the message of generic Apollo errors without code should be masked", async () => {
    process.env.NODE_ENV = "production";
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockImplementationOnce(() => {
      throw new ApolloError("Bang");
    });
    const { errors } = await query({ query: FOO });
    expect(errors).toHaveLength(1);

    const error = errors[0];
    expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
    expect(error.message).toEqual("Erreur serveur");
  });

  test("the message of unhandled errors thrown should be masked", async () => {
    process.env.NODE_ENV = "production";
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockImplementationOnce(() => {
      readFileSync("path/does/not/exist");
    });
    const { errors } = await query({ query: FOO });
    expect(errors).toHaveLength(1);

    const error = errors[0];
    expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
    expect(error.message).toEqual("Erreur serveur");
  });

  test("the message of unhandled error returned should be masked", async () => {
    process.env.NODE_ENV = "production";
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockImplementationOnce(() => {
      return readFileSync("path/does/not/exist");
    });
    const { errors } = await query({ query: FOO });
    expect(errors).toHaveLength(1);

    const error = errors[0];
    expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
    expect(error.message).toEqual("Erreur serveur");
  });

  test("unhandled errors message should be displayed in dev", async () => {
    process.env.NODE_ENV = "dev";
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockImplementationOnce(() => {
      throw new Error("Bang");
    });
    const { errors } = await query({ query: FOO });
    const error = errors[0];
    expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
    expect(error.message).toEqual("Bang");
    process.env = OLD_ENV;
  });

  test("Yup validation errors should be displayed as an input error", async () => {
    const server = require("../server").server;
    const { query } = createTestClient(server);
    mockFoo.mockImplementationOnce(() => {
      throw new ValidationError("Bang", "Wrong value", "path");
    });
    const { errors } = await query({ query: FOO });
    const error = errors[0];
    expect(error.extensions.code).toEqual("BAD_USER_INPUT");
    expect(error.message).toContain("Bang");
  });

  test("GRAPHQL_VALIDATION_FAILED should be returned when mutations variables are invalid", async () => {
    process.env.NODE_ENV = "production";
    const server = require("../server").server;
    const { mutate } = createTestClient(server);
    // invalid variable `toto` instead of `input`
    const variables = { toto: "toto" };
    const { errors } = await mutate({
      mutation: BAR,
      variables
    });
    const error = errors[0];
    expect(error.extensions.code).toEqual(ErrorCode.GRAPHQL_VALIDATION_FAILED);
    expect(error.message).toEqual(
      'Variable "$input" of required type "String!" was not provided.'
    );
  });
});
