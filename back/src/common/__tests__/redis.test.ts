import { cachedGet, generateKey } from "../redis";

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    foo: null
  }
}));

const redisCache = {
  "foo:1000": "redisBar",
  "foo:2000": JSON.stringify({ name: "foo" })
};

const mockRedisSet = jest.fn((..._args) => {
  return Promise.resolve("OK");
});

jest.mock("ioredis", () =>
  jest.fn(() => ({
    get: (key: string) => {
      return Promise.resolve(redisCache[key]).catch(() => null);
    },
    set: (...args) => mockRedisSet(...args),
    unlink: () => {
      return Promise.resolve();
    }
  }))
);

const dbFooData = {
  "3000": "sqlBar"
};

const dbGetterMock = id => {
  return Promise.resolve(dbFooData[id]);
};

describe("cachedGet", () => {
  test("should be able to get numeric key in cache", async () => {
    const foo = () => null;
    const res = await cachedGet(foo as any, "foo", 1000);

    expect(res).toBe("redisBar");
  });

  test("should be able to get string key in cache", async () => {
    const foo = () => null;
    const res = await cachedGet(foo as any, "foo", "1000");

    expect(res).toBe("redisBar");
  });

  test("should be able to get json in cache", async () => {
    const foo = () => null;
    const res = await cachedGet<{ name: string }>(foo as any, "foo", "2000", {
      parser: JSON
    });

    expect(res.name).toBe("foo");
  });

  test("should use getter when key is not cached", async () => {
    const res = await cachedGet(dbGetterMock, "foo", "3000");

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

  test("should set cache for new values", async () => {
    const res = await cachedGet(dbGetterMock, "foo", "3000");

    expect(mockRedisSet).toHaveBeenCalledWith("foo:3000", res, []);
  });

  test("should accept caching options", async () => {
    const res = await cachedGet(dbGetterMock, "foo", "3000", {
      options: { EX: 1000 }
    });

    expect(mockRedisSet).toHaveBeenCalledWith(
      "foo:3000",
      res,
      expect.arrayContaining(["EX", 1000])
    );
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
