import { rule } from "graphql-shield";
import {
  mergePermissions,
  getUid,
  sameDayMidnight,
  daysBetween
} from "../utils";

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

test("sameDayMidnight convert a date to same day at midnight", () => {
  const date = new Date("2019-10-04T20:43:00");
  const midnight = sameDayMidnight(date);
  const expected = new Date("2019-10-04T00:00:00");
  expect(midnight).toEqual(expected);
});

test("daysBetween should calculate the number of days between two dates", () => {
  const date1 = new Date("2019-10-04T20:43:00");
  const date2 = new Date("2019-10-01T09:00:00");
  const days = daysBetween(date1, date2);
  expect(days).toEqual(3);
});
