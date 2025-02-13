import { objectsEqual, packagingsEqual } from "../formHelpers";

describe("objectEquals", () => {
  test("empty objects", () => {
    expect(objectsEqual({}, {})).toEqual(true);
    expect(objectsEqual({}, { type: "FUT", quantity: 1 })).toEqual(false);
  });

  test("null values", () => {
    expect(objectsEqual(null, null)).toEqual(true);
    expect(objectsEqual(null, { type: "FUT", quantity: 1 })).toEqual(false);
    expect(objectsEqual({ type: "FUT", quantity: 1 }, null)).toEqual(false);
  });

  test("undefined values", () => {
    expect(objectsEqual(undefined, undefined)).toEqual(true);
    expect(objectsEqual({ type: "FUT", quantity: 1 }, undefined)).toEqual(
      false
    );
    expect(objectsEqual(undefined, { type: "FUT", quantity: 1 })).toEqual(
      false
    );
  });
});

describe("packagingEquals", () => {
  test("empty packaging", () => {
    expect(packagingsEqual([], [])).toEqual(true);
    expect(packagingsEqual([{ type: "FUT", quantity: 1 }], [])).toEqual(false);
  });

  test("undefined key in packaging", () => {
    expect(
      packagingsEqual([{ type: "FUT", quantity: 1 }], [{ type: "FUT" }])
    ).toEqual(false);
  });

  test("different packagings", () => {
    expect(
      packagingsEqual(
        [{ type: "FUT", quantity: 1 }],
        [{ type: "FUT", quantity: 1 }]
      )
    ).toEqual(true);
    expect(
      packagingsEqual(
        [
          { type: "FUT", quantity: 1 },
          { type: "GRV", quantity: 2 }
        ],
        [
          { type: "FUT", quantity: 1 },
          { type: "GRV", quantity: 2 }
        ]
      )
    ).toEqual(true);
    expect(
      packagingsEqual(
        [
          { type: "GRV", quantity: 2 },
          { type: "FUT", quantity: 1 }
        ],
        [
          { type: "FUT", quantity: 1 },
          { type: "GRV", quantity: 2 }
        ]
      )
    ).toEqual(true);
    expect(
      packagingsEqual(
        [
          { type: "GRV", quantity: 2 },
          { type: "FUT", quantity: 1 }
        ],
        [
          { type: "FUT", quantity: 1 },
          { type: "GRV", quantity: 3 }
        ]
      )
    ).toEqual(false);
    expect(
      packagingsEqual(
        [{ type: "OTHER", quantity: 1, other: "carton" }],
        [{ type: "OTHER", quantity: 1, other: "bidon" }]
      )
    ).toEqual(false);
  });

  test("same packagings with identification numbers", () => {
    expect(
      packagingsEqual(
        [
          {
            type: "FUT",
            quantity: 1,
            volume: 1,
            identificationNumbers: ["fut1", "fut2"]
          }
        ],
        [
          {
            type: "FUT",
            quantity: 1,
            volume: 1,
            identificationNumbers: ["fut1", "fut2"]
          }
        ]
      )
    ).toEqual(true);
  });
});
