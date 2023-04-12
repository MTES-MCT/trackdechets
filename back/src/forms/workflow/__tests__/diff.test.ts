import {
  isObject,
  isArray,
  arraysEqual,
  objectDiff,
  isString,
  stringEqual
} from "../diff";

describe("isObject", () => {
  test("object is object", () => {
    expect(isObject({ a: "a" })).toEqual(true);
  });

  test("array is not object", () => {
    expect(isObject(["a", "b"])).toEqual(false);
  });

  test("date is not object", () => {
    expect(isObject(new Date())).toEqual(false);
  });

  test("scalars are not objects", () => {
    expect(isObject(1)).toEqual(false);
    expect(isObject("a")).toEqual(false);
  });

  test("null is not object", () => {
    expect(isObject(null)).toEqual(false);
  });

  test("undefined is not object", () => {
    expect(isObject(undefined)).toEqual(false);
  });
});

describe("isArray", () => {
  test("array is array", () => {
    expect(isArray(["a", "b"])).toEqual(true);
  });

  test("object not array", () => {
    expect(isArray({ a: "a" })).toEqual(false);
  });

  test("date is not array", () => {
    expect(isArray(new Date())).toEqual(false);
  });

  test("scalars are not arrays", () => {
    expect(isArray(1)).toEqual(false);
    expect(isArray("a")).toEqual(false);
  });

  test("null is not array", () => {
    expect(isArray(null)).toEqual(false);
  });

  test("undefined is not array", () => {
    expect(isArray(undefined)).toEqual(false);
  });
});

describe("isString", () => {
  test("string is string", () => {
    expect(isString("a")).toEqual(true);
    expect(isString("")).toEqual(true);
  });

  test("array is not string", () => {
    expect(isString(["a", "b"])).toEqual(false);
  });

  test("object not string", () => {
    expect(isString({ a: "a" })).toEqual(false);
  });

  test("date is not string", () => {
    expect(isString(new Date())).toEqual(false);
  });

  test("boolean is not string", () => {
    expect(isString(true)).toEqual(false);
  });

  test("number is not string", () => {
    expect(isString(1)).toEqual(false);
  });

  test("null is not string", () => {
    expect(isString(null)).toEqual(false);
  });

  test("undefined is not string", () => {
    expect(isString(undefined)).toEqual(false);
  });
});

describe("arrayEquals", () => {
  test("arrays are equal", () => {
    expect(arraysEqual([1, 2], [1, 2])).toEqual(true);
    expect(arraysEqual([1, 2], [2, 1])).toEqual(true);
    expect(arraysEqual([], [])).toEqual(true);
    expect(arraysEqual(null, null)).toEqual(true);
    expect(arraysEqual(undefined, undefined)).toEqual(true);
  });

  test("arrays are not equal", () => {
    expect(arraysEqual([1, 2], [2, 3])).toEqual(false);
    expect(arraysEqual([1, 2], [2, 3, 4])).toEqual(false);
    expect(arraysEqual(null, [2, 3])).toEqual(false);
    expect(arraysEqual([1, 2], null)).toEqual(false);
    expect(arraysEqual(undefined, [2, 3])).toEqual(false);
    expect(arraysEqual([1, 2], undefined)).toEqual(false);
  });

  test("arrays of objects are equal", () => {
    expect(
      arraysEqual(
        [
          { a: "a", b: "b" },
          { c: "c", d: "d" }
        ],
        [
          { a: "a", b: "b" },
          { c: "c", d: "d" }
        ]
      )
    ).toEqual(true);
  });

  test.skip("arrays of objects in different order are equal", () => {
    // waiting for fix - using default Array.sort on array of objects does not work
    expect(
      arraysEqual(
        [
          { a: "a", b: "b" },
          { c: "c", d: "d" }
        ],
        [
          { c: "c", d: "d" },
          { a: "a", b: "b" }
        ]
      )
    ).toEqual(true);
  });

  test("arrays of [Object: null prototype] are equals", () => {
    const a = Object.create(null);
    const b = Object.create(null);
    a.b = b;
    expect(arraysEqual([a, a], [a, a])).toEqual(true);
  });
});

describe("stringEqual", () => {
  test("strings are equal", () => {
    expect(stringEqual("", null)).toBe(true);
    expect(stringEqual(null, "")).toBe(true);
    expect(stringEqual("", undefined)).toBe(true);
    expect(stringEqual(undefined, "")).toBe(true);
    expect(stringEqual("", "")).toBe(true);
    expect(stringEqual("a", "a")).toBe(true);
  });

  test("strings are not equal", () => {
    expect(stringEqual("a", "b")).toBe(false);
    expect(stringEqual("a", "")).toBe(false);
    expect(stringEqual("a", null)).toBe(false);
  });
});

describe("objectDiff", () => {
  test("shallow diff", () => {
    const o1 = {
      a: "a",
      b: "b",
      c: "c"
    };
    const o2 = {
      a: "a",
      b: "B",
      c: "c"
    };
    const diff = objectDiff(o1, o2);
    expect(diff).toEqual({ b: "B" });
  });

  test("deep diff", () => {
    const o1 = {
      a: {
        aa: "aa",
        ab: "ab"
      },
      b: {
        ba: "ba",
        bb: "bb"
      }
    };

    const o2 = {
      a: {
        aa: "aa",
        ab: "AB"
      },
      b: {
        ba: "ba",
        bb: "bb"
      }
    };

    const diff = objectDiff(o1, o2);
    expect(diff).toEqual({ a: { ab: "AB" } });
  });

  test("diff with array", () => {
    const o1 = {
      a: [1, 2]
    };

    const o2 = {
      a: [2, 3]
    };

    const diff = objectDiff(o1, o2);

    expect(diff).toEqual({ a: [2, 3] });
  });

  test("diff with null update", () => {
    const o1 = {
      a: "a"
    };

    const o2 = {
      a: null
    };

    const diff = objectDiff(o1, o2);
    expect(diff).toEqual({ a: null });
  });
});

describe("dateDiff", () => {
  test("diff with same date", () => {
    // same date but different object
    const date1 = new Date("2021-01-01");
    const date2 = new Date("2021-01-01");

    const o1 = {
      a: date1
    };

    const o2 = {
      a: date2
    };

    const diff = objectDiff(o1, o2);
    expect(diff).toEqual({});
  });

  test("diff with new date", () => {
    // same date but different object
    const date = new Date("2021-01-01");

    const o1 = {};

    const o2 = {
      a: date
    };

    const diff = objectDiff(o1, o2);
    expect(diff).toEqual({ a: date });
  });

  test("diff with modified date", () => {
    // same date but different object
    const date1 = new Date("2021-01-01");
    const date2 = new Date("2021-01-02");

    const o1 = {
      a: date1
    };

    const o2 = {
      a: date2
    };

    const diff = objectDiff(o1, o2);
    expect(diff).toEqual({ a: date2 });
  });

  test("diff with empty string", () => {
    const string1 = "";
    const string2 = null;

    const o1 = {
      a: string1
    };

    const o2 = {
      a: string2
    };

    expect(objectDiff(o1, o2)).toEqual({});
    expect(objectDiff(o2, o1)).toEqual({});
    expect(objectDiff(o1, { a: "another" })).toEqual({ a: "another" });
  });
});
