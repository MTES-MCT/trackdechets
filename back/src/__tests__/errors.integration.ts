import * as fs from "fs";
import { createTestClient } from "apollo-server-testing";
import { server } from "../server";
import { UserInputError } from "apollo-server-express";

const mockHello = jest.fn();

jest.mock("../schema.ts", () => ({
  typeDefs: `
    type Query {
        hello: String
      }
  `,
  resolvers: {
    Query: {
      hello: () => mockHello()
    }
  },
  permissions: {},
  validations: {}
}));

const HELLO = `query { hello }`;

describe("Error handling", () => {
  afterEach(() => {
    mockHello.mockReset();
  });

  test("errors should be null if query resolve correctly", async () => {
    const { query } = createTestClient(server);
    mockHello.mockResolvedValueOnce("world");
    const { errors, data } = await query({ query: HELLO });
    expect(errors).toBeUndefined();
    expect(data).toEqual({ hello: "world" });
  });

  test("handled errors should be formatted correctly", async () => {
    const { query } = createTestClient(server);
    const message = "Oups";
    mockHello.mockImplementationOnce(() => {
      throw new UserInputError(message);
    });
    const { errors } = await query({ query: HELLO });
    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error.message).toEqual(message);
    expect(error.extensions.code).toEqual("BAD_USER_INPUT");
  });

  test("unhandled errors message should not be displayed", async () => {
    const { query } = createTestClient(server);
    mockHello.mockImplementationOnce(() => {
      fs.readFileSync("/does/not/exist");
    });

    const { errors } = await query({ query: HELLO });
    expect(errors).toHaveLength(1);

    const error = errors[0];
    expect(error.extensions.code).toEqual("INTERNAL_SERVER_ERROR");
    expect(error.message).toEqual("Erreur serveur");
  });
});
