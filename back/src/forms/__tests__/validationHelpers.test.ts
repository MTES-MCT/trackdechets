import { object } from "yup";

import { validDate } from "../validation-helpers";

const dummySchema = object({
  someDate: validDate({ verboseFieldName: "date de test", required: true })
});

describe("Test validDate helper", () => {
  test.each([
    "2020-12-30",
    "2020-12-30T23:45:55",
    "2020-12-30T23:45:55Z",
    "2020-12-30T23:45:55+08",
    "2020-12-30T23:45:55.987"
  ])("validDate is valid with date formatted as %p", async dateStr => {
    const isValid = await dummySchema.isValid({ someDate: dateStr });
    expect(isValid).toEqual(true);
  });

  test.each([
    "20201230",
    "2020-12-30 23:45:55",
    "2020-12-30T23 45 55",
    33,
    "junk"
  ])("validDate is invalid with date formatted as %p", async dateStr => {
    const isValid = await dummySchema.isValid({ someDate: dateStr });
    expect(isValid).toEqual(false);
  });

  test.each([{ someDate: null }, {}])(
    "validDate is invalid with empty or null value",
    async params => {
      const isValid = await dummySchema.isValid(params);
      expect(isValid).toEqual(false);
    }
  );
});
