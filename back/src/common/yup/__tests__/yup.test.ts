import * as yup from "yup";
import { format } from "date-fns";
import { allowedFormats } from "../../dates";

describe("yup.date()", () => {
  test.each(allowedFormats)("%p is a valid format for yup.date()", f => {
    const date = new Date("2020-01-01");
    const isValid = yup.date().isValidSync(format(date, f));
    expect(isValid).toEqual(true);
  });
});
