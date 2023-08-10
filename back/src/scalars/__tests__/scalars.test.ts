import { ApolloServer } from "@apollo/server";
import gql from "graphql-tag";
import { format } from "date-fns";
import scalars from "..";
import { UserInputError } from "../../common/errors";
import assert from "node:assert";

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
    const { body } = await server.executeOperation<any>({ query: FOO_QUERY });

    assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data!.foo.bar).toEqual(bar.toISOString());
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
    await server.executeOperation({
      query: CREATE_FOO,
      variables: {
        bar: format(bar, f)
      }
    });
    expect(createFooMock).toHaveBeenCalledWith(bar);
  });

  it("should fail validation when invalid date format", async () => {
    const { body } = await server.executeOperation({
      query: CREATE_FOO,
      variables: { bar: "2020-33-02" }
    });

    assert(body.kind === "single");
    expect(body.singleResult.errors).toEqual([
      new UserInputError(
        `Variable "$bar" got invalid value "2020-33-02"; Seul les chaînes de caractères au format ISO 8601 sont acceptées en tant que date. Reçu 2020-33-02.`
      )
    ]);
  });

  it("should fail validation when invalid type", async () => {
    const { body } = await server.executeOperation({
      query: CREATE_FOO,
      variables: { bar: 1 }
    });

    assert(body.kind === "single");
    expect(body.singleResult.errors).toEqual([
      new UserInputError(
        `Variable "$bar" got invalid value 1; Seul les chaînes de caractères au format ISO 8601 sont acceptées en tant que date. Reçu 1.`
      )
    ]);
  });
});

describe("String", () => {
  afterAll(() => jest.clearAllMocks());

  const typeDefs = gql`
    scalar String
    type Foo {
      bar: String
    }
    type Query {
      foo: Foo
    }
    type Mutation {
      createFoo(bar: String!): Foo
    }
  `;

  const resolveFooMock = jest.fn();
  const createFooMock = jest.fn();

  const resolvers = {
    String: scalars.String,
    Query: {
      foo: () => {
        return resolveFooMock();
      }
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

  const FOO_QUERY = gql`
    query {
      foo {
        bar
      }
    }
  `;

  const CREATE_FOO = gql`
    mutation CreateFoo($bar: String!) {
      createFoo(bar: $bar) {
        bar
      }
    }
  `;

  it("should not modify valid string", async () => {
    resolveFooMock.mockReturnValue({ bar: "bar" });
    const { body } = await server.executeOperation<any>({ query: FOO_QUERY });
    assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data!.foo.bar).toEqual("bar");
  });

  it("should not modify a null value", async () => {
    resolveFooMock.mockReturnValue({ bar: null });
    const { body } = await server.executeOperation<any>({ query: FOO_QUERY });
    assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data!.foo.bar).toEqual(null);
  });

  it("should not modify an empty string", async () => {
    resolveFooMock.mockReturnValue({ bar: "" });
    const { body } = await server.executeOperation<any>({ query: FOO_QUERY });
    assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data!.foo.bar).toEqual("");
  });

  it("should remove <script> tag", async () => {
    resolveFooMock.mockReturnValue({ bar: "<script>oué</script>" });
    const { body } = await server.executeOperation<any>({ query: FOO_QUERY });
    assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data!.foo.bar).toEqual("oué");
  });

  it("should remove forbidden opening tag only", async () => {
    resolveFooMock.mockReturnValue({ bar: "<script>yes" });
    const { body } = await server.executeOperation<any>({ query: FOO_QUERY });
    assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data!.foo.bar).toEqual("yes");
  });

  it("should escape < and >", async () => {
    resolveFooMock.mockReturnValue({ bar: "> <" });
    const { body } = await server.executeOperation<any>({ query: FOO_QUERY });
    assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data!.foo.bar).toEqual("&gt; &lt;");
  });

  it("should leave incoming data untouched", async () => {
    await server.executeOperation({
      query: CREATE_FOO,
      variables: {
        bar: "<script>"
      }
    });
    expect(createFooMock).toHaveBeenCalledWith("<script>");
  });
});
