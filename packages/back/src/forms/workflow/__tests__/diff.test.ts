import { isObject, isArray, arraysEqual, objectDiff } from "../diff";

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

describe("arrayEquals", () => {
  test("arrays are equal", () => {
    expect(arraysEqual([1, 2], [1, 2])).toEqual(true);
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
});
