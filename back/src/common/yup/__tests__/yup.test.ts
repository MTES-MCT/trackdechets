import * as yup from "yup";
import configureYup from "../configureYup";

describe("yup.date().allowedFormat()", () => {
  beforeAll(() => {
    configureYup();
  });

  test.each([
    "2020-12-30",
    "2020-12-30T23:45:55",
    "2020-12-30T23:45:55Z",
    "2020-12-30T23:45:55+08",
    "2020-12-30T23:45:55.987"
  ])(
    "yup.date().allowedFormat() is valid with date formatted as %p",
    dateStr => {
      const isValid = yup.date().allowedFormat().isValidSync(dateStr);
      expect(isValid).toEqual(true);
    }
  );

  test.each([
    "20201230",
    "2020-12-30 23:45:55",
    "2020-12-30T23 45 55",
    33,
    "junk",
    ""
  ])(
    "yup.date().allowedFormat() is invalid with date formatted as %p",
    dateStr => {
      const validate = () => yup.date().allowedFormat().validateSync(dateStr);
      expect(validate).toThrowError("La date n'est pas formatée correctement");
    }
  );

  test("yup.date().allowedFormat() should set custom error message", () => {
    const msg = "BANG";
    expect(() => yup.date().allowedFormat(msg).validateSync("")).toThrow(msg);
  });
});
