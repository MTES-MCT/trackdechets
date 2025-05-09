import { readFileSync } from "fs";
import { ErrorCode, UserInputError } from "../common/errors";
import { GraphQLError } from "graphql";

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
  }
}));

const FOO = `query { foo }`;
const BAR = `
  mutation Bar($input: String!){
    bar(input: $input)
  }
`;

describe("Error handling", () => {
  afterEach(() => {
    mockFoo.mockReset();
  });

  describe("NODE_ENV=test", () => {
    let server;
    beforeAll(() => {
      jest.resetModules();
      server = require("../server").server;
    });

    test("Yup validation errors should be displayed as an input error", async () => {
      const yup = require("yup");

      mockFoo.mockImplementationOnce(() => {
        yup.string().required().validateSync(null);
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      const error = errors[0];
      expect(error.extensions.code).toEqual("BAD_USER_INPUT");
      expect(error.message).toEqual("this ne peut pas être null");
    });

    test("Zod validation errors should be displayed as an input error", async () => {
      const { z } = require("zod");
      mockFoo.mockImplementationOnce(() => {
        z.string().parse(1);
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      const error = errors[0];
      expect(error.extensions.code).toEqual("BAD_USER_INPUT");
      expect(error.message).toEqual(
        "Le type « chaîne de caractères » est attendu mais « nombre » a été reçu"
      );
    });
  });

  describe("NODE_ENV=production", () => {
    let server;
    beforeAll(() => {
      jest.resetModules();
      process.env.NODE_ENV = "production";
      server = require("../server").server;
    });

    test("errors should be null if query resolve correctly", async () => {
      mockFoo.mockResolvedValueOnce("bar");
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      expect(body.singleResult.errors).toBeUndefined();
      expect(body.singleResult.data).toEqual({ foo: "bar" });
    });

    test("GRAPHQL_VALIDATION_ERROR should resolves correctly", async () => {
      const { body } = await server.executeOperation(
        { query: "query { foobar }" }, // query inconnue
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);
      const error = errors[0];
      expect(error.message).toEqual(
        'Cannot query field "foobar" on type "Query". Did you mean "foo"?'
      );
      expect(error.extensions.code).toEqual("GRAPHQL_VALIDATION_FAILED");
    });

    test("GRAPHQL_PARSE_FAILED error should resolves correctly", async () => {
      const { body } = await server.executeOperation(
        { query: "query { foo" }, // missing bracket
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);
      const error = errors[0];
      expect(error.message).toEqual(
        "Syntax Error: Expected Name, found <EOF>."
      );
      expect(error.extensions.code).toEqual("GRAPHQL_PARSE_FAILED");
    });

    test("subclasses of Apollo errors should be formatted correctly when thrown", async () => {
      mockFoo.mockImplementationOnce(() => {
        throw new UserInputError("Oups");
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);
      const error = errors[0];
      expect(error.message).toEqual("Oups");
      expect(error.extensions.code).toEqual("BAD_USER_INPUT");
    });

    test("subclasses of Apollo errors should be formatted correctly when returned", async () => {
      mockFoo.mockImplementationOnce(() => {
        return new UserInputError("Oups");
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);
      const error = errors[0];
      expect(error.message).toEqual("Oups");
      expect(error.extensions.code).toEqual("BAD_USER_INPUT");
    });

    test("the message of generic Apollo errors without code should be masked", async () => {
      mockFoo.mockImplementationOnce(() => {
        throw new GraphQLError("Bang");
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);

      const error = errors[0];
      expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
      expect(error.message).toEqual("Erreur serveur");
    });

    test("Sentry id should be displayed when available", async () => {
      mockFoo.mockImplementationOnce(() => {
        const error = new GraphQLError("Bang");
        (error as any).sentryId = "sentry_id";
        throw error;
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);

      const error = errors[0];
      expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
      expect(error.message).toEqual(
        "Erreur serveur : rapport d'erreur sentry_id"
      );
    });

    test("the message of unhandled errors thrown should be masked", async () => {
      mockFoo.mockImplementationOnce(() => {
        readFileSync("path/does/not/exist");
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);

      const error = errors[0];
      expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
      expect(error.message).toEqual("Erreur serveur");
    });

    test("the message of unhandled error returned should be masked", async () => {
      mockFoo.mockImplementationOnce(() => {
        return readFileSync("path/does/not/exist");
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      expect(errors).toHaveLength(1);

      const error = errors[0];
      expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
      expect(error.message).toEqual("Erreur serveur");
    });

    test("BAD_USER_INPUT should be returned when mutations variables are invalid", async () => {
      // invalid variable `toto` instead of `input`
      const variables = { toto: "toto" };
      const { body } = await server.executeOperation(
        {
          query: BAR,
          variables
        },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      const error = errors[0];
      expect(error.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(error.message).toEqual(
        'Variable "$input" of required type "String!" was not provided.'
      );
    });
  });

  describe("NODE_ENV=dev", () => {
    let server;
    beforeAll(() => {
      jest.resetModules();
      process.env.NODE_ENV = "dev";
      server = require("../server").server;
    });

    test("unhandled errors message should be displayed in dev", async () => {
      mockFoo.mockImplementationOnce(() => {
        throw new Error("Bang");
      });
      const { body } = await server.executeOperation(
        { query: FOO },
        { contextValue: { req: {}, res: { locals: {} } } }
      );
      const errors = body.singleResult.errors;
      const error = errors[0];
      expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
      expect(error.message).toEqual("Bang");
    });
  });
});
