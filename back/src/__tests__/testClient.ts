import { User } from "@prisma/client";
import { server, serverDataloaders } from "../server";
import { DocumentNode, print } from "graphql";
import { AuthType } from "../auth";
import assert from "node:assert";

type StringOrAst = string | DocumentNode;
type Options<T extends object> = { variables?: T };

type RequiredAndNotNull<T> = { [P in keyof T]-?: Exclude<T[P], null> };

/**
 * Instantiate test client
 */
function makeClient(user?: (User & { auth?: AuthType }) | null) {
  async function query<
    T extends object = Record<string, unknown>,
    V extends object = Record<string, unknown>
  >(operation: StringOrAst, { variables }: Options<V> = {}) {
    const { body } = await server.executeOperation<T, V>(
      {
        query: typeof operation === "string" ? operation : print(operation),
        variables
      },
      {
        contextValue: {
          dataloaders: serverDataloaders,
          ...(user && { user: { auth: AuthType.Session, ...user } })
        } as any
      }
    );

    assert(body.kind === "single");

    // For retro compatibility with our previous setup, remove null and undefined from data
    // TODO: Remove this "hack" and edit all our tests to account for possible nulls
    type ReturnType = typeof body.singleResult;
    return body.singleResult as RequiredAndNotNull<ReturnType>;
  }

  return { mutate: query, query };
}

export default makeClient;
