import { mergeDefaults } from "../helper";

describe("mergeDefaults", () => {
  it("should keep the defaults", () => {
    expect(mergeDefaults({ foo: "" }, {})).toEqual({
      foo: "",
    });
  });

  it("should favor the provided options", () => {
    expect(mergeDefaults({ foo: "" }, { foo: "FOO" })).toEqual({
      foo: "FOO",
    });
  });

  it("should not mutate defaults object", () => {
    const defaults = { foo: "" };
    mergeDefaults(defaults, { foo: "FOO" });

    expect(defaults).toEqual({
      foo: "",
    });
  });

  it("should keep the nested defaults", () => {
    expect(mergeDefaults({ foo: { bar: "" } }, {})).toEqual({
      foo: {
        bar: "",
      },
    });
  });

  it("should favor the nested provided options", () => {
    expect(
      mergeDefaults({ foo: { bar: "" } }, { foo: { bar: "BAR" } })
    ).toEqual({
      foo: {
        bar: "BAR",
      },
    });
  });

  it("should not mutate defaults object nested", () => {
    const defaults = { foo: { bar: "" } };
    mergeDefaults(defaults, { foo: { bar: "BAR" } });

    expect(defaults).toEqual({
      foo: {
        bar: "",
      },
    });
  });

  it("should not extend the defaults", () => {
    expect(mergeDefaults({ foo: "" }, { bar: "" })).toEqual({
      foo: "",
    });
  });

  it("should not extend the nested defaults", () => {
    expect(mergeDefaults({ foo: { bar: "" } }, { foo: { baz: "" } })).toEqual({
      foo: {
        bar: "",
      },
    });
  });
});
