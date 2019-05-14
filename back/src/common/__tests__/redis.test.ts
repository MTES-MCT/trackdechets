import * as Redis from "ioredis";
// import * as prismaClient from "../../generated/prisma-client";
import { getByIdFromCache, generateKey } from "../redis";

jest.mock("../../generated/prisma-client", () => ({
  prisma: { foo: null }
}));

const redisCache = {
  "foo:1000": "redisBar",
  "foo:2000": JSON.stringify({ name: "foo" })
};

jest.mock("ioredis", () => () => ({
  get: (key: string) => {
    return Promise.resolve(redisCache[key]).catch(_ => null);
  },
  set: (key: string, value: string) => {
    return Promise.resolve("OK");
  }
}));

const dbFooData = {
  "3000": "sqlBar"
};

const getterMock = ({ id }) => {
  return Promise.resolve(dbFooData[id]);
};

describe("getByIdFromCache", () => {
  test("get numeric key in cache", async () => {
    const foo = () => null;
    const res = await getByIdFromCache(foo, 1000);

    expect(res).toBe("redisBar");
  });

  test("get string key in cache", async () => {
    const foo = () => null;
    const res = await getByIdFromCache(foo, "1000");

    expect(res).toBe("redisBar");
  });

  test("get json in cache", async () => {
    const foo = () => null;
    const res = await getByIdFromCache(foo, "2000", JSON);

    expect(res.name).toBe("foo");
  });

  test("get string key in db", async () => {
    const foo = params => getterMock(params);
    const res = await getByIdFromCache(foo, "3000");

    expect(res).toBe("sqlBar");
  });
});

describe("generateKey", () => {
  test("generate basic key with type and text id", () => {
    const res = generateKey("foo", "bar");

    expect(res).toBe("foo:bar");
  });

  test("generate basic key with type and numeric id", () => {
    const res = generateKey("foo", 1);

    expect(res).toBe("foo:1");
  });

  test("generate basic key with camelCase type and text id", () => {
    const res = generateKey("fooBar", "bar");

    expect(res).toBe("foo-bar:bar");
  });

  test("generate basic key with camelCase type, text id, and a type", () => {
    const res = generateKey("fooBar", "bar", "field");

    expect(res).toBe("foo-bar:bar:field");
  });
});
