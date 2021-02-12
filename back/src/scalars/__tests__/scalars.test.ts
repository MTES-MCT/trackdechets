import { ApolloServer, gql } from "apollo-server-express";
import { createTestClient } from "apollo-server-testing";
import { format } from "date-fns";
import { GraphQLError } from "graphql";
import scalars from "..";

describe("DateTime", () => {
  afterAll(() => jest.clearAllMocks());

  const typeDefs = gql`
    scalar DateTime

    type Foo {
      bar: DateTime!
    }

    type Query {
      foo: Foo
    }

    type Mutation {
      createFoo(bar: DateTime!): Foo
    }
  `;

  const bar = new Date("2021-01-01");

  const createFooMock = jest.fn();

  const resolvers = {
    DateTime: scalars.DateTime,
    Query: {
      foo: () => ({
        bar
      })
    },
    Mutation: {
      createFoo: (_, { bar }) => {
        createFooMock(bar);
        return { bar };
      }
    }
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  const { query, mutate } = createTestClient(server);

  const FOO_QUERY = gql`
    query {
      foo {
        bar
      }
    }
  `;

  const CREATE_FOO = gql`
    mutation CreateFoo($bar: DateTime!) {
      createFoo(bar: $bar) {
        bar
      }
    }
  `;

  it("should format date to ISO string", async () => {
    const { data } = await query({ query: FOO_QUERY });
    expect(data.foo.bar).toEqual(bar.toISOString());
  });

  it.each(
    // these formats are the one accepted historically but we
    // accept all ISO 8601 formats
    [
      "yyyy-MM-dd",
      "yyyy-MM-dd'T'HH:mm:ss",
      "yyyy-MM-dd'T'HH:mm:ssX",
      "yyyy-MM-dd'T'HH:mm:ss.SSS",
      "yyyy-MM-dd'T'HH:mm:ss.SSSX"
    ]
  )("ISO 8601 format like %s should be parsed correctly", async f => {
    await mutate({
      mutation: CREATE_FOO,
      variables: {
        bar: format(bar, f)
      }
    });
    expect(createFooMock).toHaveBeenCalledWith(bar);
  });

  it("should fail validation when invalid date format", async () => {
    const { errors } = await mutate({
      mutation: CREATE_FOO,
      variables: { bar: "2020-33-02" }
    });
    expect(errors).toEqual([
      new GraphQLError(
        `Variable "$bar" got invalid value "2020-33-02"; Expected type DateTime. Seul les chaînes de caractères au format ISO 8601 sont acceptées en tant que date. Reçu 2020-33-02.`
      )
    ]);
  });

  it("should fail validation when invalid type", async () => {
    const { errors } = await mutate({
      mutation: CREATE_FOO,
      variables: { bar: 1 }
    });
    expect(errors).toEqual([
      new GraphQLError(
        `Variable "$bar" got invalid value 1; Expected type DateTime. Seul les chaînes de caractères au format ISO 8601 sont acceptées en tant que date. Reçu 1.`
      )
    ]);
  });
});
