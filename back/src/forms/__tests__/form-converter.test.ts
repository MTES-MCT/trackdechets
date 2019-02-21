import { flattenObjectForDb, unflattenObjectFromDb } from "../form-converter";

const apiShape = {
  emitter: {
    company: {
      name: "test"
    },
    otherField: "other"
  },
  boolean: true,
  number: 2,
  flat: "flat",
  null: null,
  array: [1]
};

const dbShape = {
  emitterCompanyName: "test",
  emitterOtherField: "other",
  boolean: true,
  number: 2,
  flat: "flat",
  null: null,
  array: [1]
};

describe('flattenInoutObjectForDb', () => {
  test("flattenObject deeply flatten objects", () => {
    expect(flattenObjectForDb(apiShape)).toEqual(dbShape);
  });
})

describe('unflattenObjectFromDb', () => {
  test("unflatten deeply flatten objects", () => {
    expect(unflattenObjectFromDb(dbShape)).toEqual(apiShape);
  });
})


