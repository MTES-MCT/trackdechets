import { isObject, isArray, isString } from "../dataTypes";

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
