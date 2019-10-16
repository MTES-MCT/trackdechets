import * as Redis from "ioredis";
// import * as prismaClient from "../../generated/prisma-client";
import { cachedGet, generateKey } from "../redis";

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

const getterMock = id => {
  return Promise.resolve(dbFooData[id]);
};

describe("cachedGet", () => {
  test("should be able to get numeric key in cache", async () => {
    const foo = () => null;
    const res = await cachedGet(foo, "foo", 1000);

    expect(res).toBe("redisBar");
  });

  test("should be able to get string key in cache", async () => {
    const foo = () => null;
    const res = await cachedGet(foo, "foo", "1000");

    expect(res).toBe("redisBar");
  });

  test("should be able to get json in cache", async () => {
    const foo = () => null;
    const res = await cachedGet(foo, "foo", "2000", JSON);

    expect(res.name).toBe("foo");
  });

  test("should be able to get string key in db", async () => {
    const res = await cachedGet(getterMock, "foo", "3000");

    expect(res).toBe("sqlBar");
  });

  test("should throw if getter fails and value is not cached", async () => {
    const throwMessage = "uh oh...";
    try {
      await cachedGet(() => Promise.reject(throwMessage), "foo", "3000");

      expect(1).toBe(0);
    } catch (err) {
      expect(err).toBe(throwMessage);
    }
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
