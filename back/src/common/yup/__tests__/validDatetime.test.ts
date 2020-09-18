import * as yup from "yup";
import validDatetime from "../validDatetime";

describe("validDateTime", () => {
  const dummySchema = yup.object({
    someDate: validDatetime({
      verboseFieldName: "date de test",
      required: true
    })
  });

  test.each([
    "2020-12-30",
    "2020-12-30T23:45:55",
    "2020-12-30T23:45:55Z",
    "2020-12-30T23:45:55+08",
    "2020-12-30T23:45:55.987"
  ])("validDatetime is valid with date formatted as %p", async dateStr => {
    const isValid = await dummySchema.isValid({ someDate: dateStr });
    expect(isValid).toEqual(true);
  });

  test.each([
    "20201230",
    "2020-12-30 23:45:55",
    "2020-12-30T23 45 55",
    33,
    "junk"
  ])("validDatetime is invalid with date formatted as %p", async dateStr => {
    const isValid = await dummySchema.isValid({ someDate: dateStr });
    expect(isValid).toEqual(false);
  });

  test.each([{ someDate: null }, {}])(
    "validDatetime is invalid with empty or null value",
    async params => {
      const isValid = await dummySchema.isValid(params);
      expect(isValid).toEqual(false);
    }
  );
});
