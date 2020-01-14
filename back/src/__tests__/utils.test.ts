import { rule } from "graphql-shield";
import { mergePermissions, getUid } from "../utils";

test("mergePermissions merge a list of graphql-shield permissions", () => {
  const isAuthenticated = rule()(() => true);
  const isAdmin = rule()(() => false);

  const rule1 = {
    Query: {
      frontPage: isAuthenticated,
      fruits: isAuthenticated
    },
    Mutation: {
      addFruitToBasket: isAuthenticated
    }
  };
  const rule2 = {
    Query: {
      customers: isAdmin
    },
    Mutation: {
      removeCustomer: isAdmin
    }
  };

  // empty rule
  const rule3 = {};
  const merged = mergePermissions([rule1, rule2, rule3]);
  const expected = {
    Query: {
      frontPage: isAuthenticated,
      fruits: isAuthenticated,
      customers: isAdmin
    },
    Mutation: {
      addFruitToBasket: isAuthenticated,
      removeCustomer: isAdmin
    }
  };

  expect(merged).toEqual(expected);
});

test("getUid returns a unique identifier of fixed length", () => {
  const uid = getUid(10);
  expect(uid).toHaveLength(10);
});
