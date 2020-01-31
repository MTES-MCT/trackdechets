import { graphql } from "graphql";
import { applyMiddleware } from "graphql-middleware";
import { makeExecutableSchema } from "graphql-tools";
import { schemaValidation } from "../index";

describe("generates correct middleware", () => {
  const yupObjectMock = {
    validate: jest.fn(() => Promise.resolve(true))
  };

  beforeEach(() => {
    yupObjectMock.validate.mockClear();
  });

  test("correctly applies field rule to single query field", async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        type: Type
      }
      type Type {
        a: String
      }
    `;

    const resolvers = {
      Query: {
        a: () => "a",
        type: () => ({})
      },
      Type: {
        a: () => "a"
      }
    };

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    /* Permissions */

    const permissions = schemaValidation({
      Query: { a: yupObjectMock as any }
    });

    const schemaWithPermissions = applyMiddleware(schema, permissions);

    /* Execution */
    const query = `
      query {
        a
        type {
          a
        }
      }
    `;

    const res = await graphql(schemaWithPermissions, query);

    /* Tests */

    expect(res).toEqual({
      data: {
        a: "a",
        type: {
          a: "a"
        }
      }
    });
    expect(yupObjectMock.validate).toBeCalledTimes(1);
  });

  test("correctly applies field rule to every type", async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        type: Type
      }
      type Type {
        a: String
      }
    `;

    const resolvers = {
      Query: {
        a: () => "a",
        type: () => ({})
      },
      Type: {
        a: () => "a"
      }
    };

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    /* Permissions */

    const permissions = schemaValidation({
      Query: { a: yupObjectMock as any },
      Type: { a: yupObjectMock as any }
    });

    const schemaWithPermissions = applyMiddleware(schema, permissions);

    /* Execution */
    const query = `
      query {
        a
        type {
          a
        }
      }
    `;

    expect(yupObjectMock.validate).not.toBeCalled();
    const res = await graphql(schemaWithPermissions, query);

    /* Tests */

    expect(res).toEqual({
      data: {
        a: "a",
        type: {
          a: "a"
        }
      }
    });
    expect(yupObjectMock.validate).toBeCalledTimes(2);
  });
});
