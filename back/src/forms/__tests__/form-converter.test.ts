import { flattenObjectForDb, hasAny, nullIfNoValues } from "../form-converter";

const apiShape = {
  emitter: {
    company: {
      name: "test"
    },
    pickupSite: "A site",
    workSite: {
      name: "A name"
    },
    otherField: "other"
  },
  boolean: true,
  number: 2,
  flat: "flat",
  null: null,
  array: [1],
  arrayOfObject: [{ foo: "bar" }],
  // relation, no flattening
  ecoOrganisme: {
    id: "an id"
  },
  temporaryStorageDetail: {
    destination: {
      company: { siret: "a siret" },
      cap: "cap"
    }
  }
};

const dbShape = {
  emitterCompanyName: "test",
  emitterPickupSite: "A site",
  emitterWorkSiteName: "A name",
  emitterOtherField: "other",
  boolean: true,
  number: 2,
  flat: "flat",
  null: null,
  array: [1],
  arrayOfObject: [{ foo: "bar" }],
  ecoOrganisme: {
    id: "an id"
  },
  temporaryStorageDetail: {
    destinationCompanySiret: "a siret",
    destinationCap: "cap"
  }
};

describe("flattenInoutObjectForDb", () => {
  test("flattenObject deeply flatten objects", () => {
    expect(flattenObjectForDb(apiShape)).toEqual(dbShape);
  });

  test("flattenObject null object", () => {
    expect(flattenObjectForDb(null)).toEqual({});
  });

  test("flattenObject undefined object", () => {
    expect(flattenObjectForDb(undefined)).toEqual({});
  });
});

test("hasAny", () => {
  expect(hasAny()).toBeFalsy();
  expect(hasAny(null, null, null, null)).toBeFalsy();
  expect(hasAny(1, "foo", true, "bar")).toBeTruthy();
  expect(hasAny(null, null, false, null)).toBeTruthy();
  expect(hasAny("", null, null, null)).toBeTruthy();
  expect(hasAny(null, 0, null, null)).toBeTruthy();
});

test("nullIfNoValues", () => {
  let obj = { a: null, b: null };
  expect(nullIfNoValues(obj)).toEqual(null);
  obj = { a: "a", b: "b" };
  expect(nullIfNoValues(obj)).toEqual(obj);
  obj = { a: "a", b: null };
  expect(nullIfNoValues(obj)).toEqual(obj);
});
