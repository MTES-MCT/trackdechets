import { isForeignVat, isFRVat, isOmi, isVat } from "../companySearchHelpers";

test("isVat", () => {
  expect(isVat("FR87850019464")).toEqual(true);
  expect(isVat("BE0541696005")).toEqual(true);
});

test("isFRVat", () => {
  expect(isFRVat("FR.87850019464")).toEqual(false);
  expect(isFRVat("FR 87850019464")).toEqual(false);
  expect(isFRVat("FR87-85-0019464")).toEqual(false);
  expect(isFRVat("FR87850019464")).toEqual(true);
  expect(isFRVat("BE0541696005")).toEqual(false);
});

test("not isVat", () => {
  expect(isVat("BE-05-41696005")).toEqual(false);
  expect(isVat("BE 05 41696005")).toEqual(false);
  expect(isVat("BE.05.41696005")).toEqual(false);
});

test("not isFRVat", () => {
  expect(isFRVat("FR.87850019464")).toEqual(false);
  expect(isFRVat("FR 87850019464")).toEqual(false);
  expect(isFRVat("BE 0541696005")).toEqual(false);
  expect(isFRVat("BE-0541696005")).toEqual(false);
});

test("isOMI", () => {
  expect(isOmi("OMI.87850019464")).toEqual(false);
  expect(isOmi("OMI87850019464")).toEqual(false);
  expect(isOmi("OMI 87850019464")).toEqual(false);
  expect(isOmi("OMI878.50019464")).toEqual(false);
  expect(isOmi("OMI878.5001")).toEqual(false);
  expect(isOmi("FR87850019464")).toEqual(false);
  expect(isOmi("OMI8785001")).toEqual(true);
});

test("isForeignVat", () => {
  expect(isForeignVat("FR.87850019464")).toEqual(false);
  expect(isForeignVat("FR 87850019464")).toEqual(false);
  expect(isForeignVat("FR87-85-0019464")).toEqual(false);
  expect(isForeignVat("FR87850019464")).toEqual(false);
  expect(isForeignVat("BE0541696005")).toEqual(true);
});
