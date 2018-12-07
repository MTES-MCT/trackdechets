import { flattenInoutObjectForDb, unflattenObjectFromDb } from "../form-converter";

const apiShape = {
  emitter: {
    company: {
      name: "test"
    },
    otherField: "other"
  },
  boolean: true,
  number: 2,
  flat: "flat"
};

const dbShape = {
  emitterCompanyName: "test",
  emitterOtherField: "other",
  boolean: true,
  number: 2,
  flat: "flat"
};

test("flattenObject deeply flatten objects", () => {
  expect(flattenInoutObjectForDb(apiShape)).toEqual(dbShape);
});

test("unflatten deeply flatten objects", () => {
  expect(unflattenObjectFromDb(dbShape)).toEqual(apiShape);
});


