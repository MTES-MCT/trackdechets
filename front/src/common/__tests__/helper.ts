import { toMacroCase, formatDate } from "../helper";

describe("helper methods", () => {
  describe("toMacroCase", () => {
    test("aString", () => {
      const res = toMacroCase("aString");
      expect(res).toBe("A_STRING");
    });

    test("string", () => {
      const res = toMacroCase("string");
      expect(res).toBe("STRING");
    });

    test("a string", () => {
      const res = toMacroCase("a string");
      expect(res).toBe("A_STRING");
    });

    test("a String", () => {
      const res = toMacroCase("a String");
      expect(res).toBe("A_STRING");
    });

    test("a     String", () => {
      const res = toMacroCase("a     String");
      expect(res).toBe("A_STRING");
    });
  });

  test("formatDate", () => {
    const date = new Date("2019-10-04 00:00:00");
    expect(formatDate(date)).toEqual("2019-10-04");
  });
});
