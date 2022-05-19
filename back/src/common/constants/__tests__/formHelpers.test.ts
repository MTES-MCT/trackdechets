import { packagingsEqual } from "../formHelpers";

describe("packagingEquals", () => {
  test("empty packaging", () => {
    expect(packagingsEqual([], [])).toEqual(true);
    expect(packagingsEqual([{ type: "FUT", quantity: 1 }], [])).toEqual(false);
  });
  test("null packaging", () => {
    expect(packagingsEqual(null, null)).toEqual(true);
    expect(packagingsEqual([{ type: "FUT", quantity: 1 }], null)).toEqual(
      false
    );
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
});
