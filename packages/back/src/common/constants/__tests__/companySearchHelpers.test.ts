import { isFRVat, isVat } from "../companySearchHelpers";

test("isVat", () => {
  expect(isVat("FR87850019464")).toEqual(true);
  expect(isVat("BE0541696005")).toEqual(true);
});

test("isFRVat", () => {
  expect(isFRVat("FR87850019464")).toEqual(true);
  expect(isFRVat("BE0541696005")).toEqual(false);
});
