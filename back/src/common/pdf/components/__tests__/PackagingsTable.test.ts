import { PackagingInfo } from "@td/codegen-back";
import { getPackagingsRows } from "../PackagingsTable";

describe("getPackagingsRows", () => {
  it("should return correct rows for single type of packaging with single volume", () => {
    const packagingInfos: PackagingInfo[] = [
      { type: "FUT", quantity: 2, volume: 30, identificationNumbers: [] },
      { type: "FUT", quantity: 3, volume: 30, identificationNumbers: [] }
    ];

    const result = getPackagingsRows(packagingInfos);
    expect(result).toEqual([{ quantity: 5, packagingsLabel: "Fûts 30l" }]);
  });

  it("should return correct rows for single type of packaging with multiple volumes", () => {
    const packagingInfos: PackagingInfo[] = [
      { type: "FUT", quantity: 2, volume: 30, identificationNumbers: [] },
      { type: "FUT", quantity: 3, volume: 50, identificationNumbers: [] }
    ];

    const result = getPackagingsRows(packagingInfos);
    expect(result).toEqual([
      { quantity: 5, packagingsLabel: "Fûts (2 x 30l, 3 x 50l)" }
    ]);
  });

  it(
    "should return correct rows for single type of packaging with multiple volumes" +
      "including one null volume",
    () => {
      const packagingInfos: PackagingInfo[] = [
        { type: "FUT", quantity: 2, volume: null, identificationNumbers: [] },
        { type: "FUT", quantity: 3, volume: 50, identificationNumbers: [] }
      ];

      const result = getPackagingsRows(packagingInfos);
      expect(result).toEqual([
        { quantity: 5, packagingsLabel: "Fûts (2, 3 x 50l)" }
      ]);
    }
  );

  it("should return correct rows for multiple types of packaging", () => {
    const packagingInfos: PackagingInfo[] = [
      { type: "FUT", quantity: 2, volume: 30, identificationNumbers: [] },
      { type: "GRV", quantity: 1, volume: 1000, identificationNumbers: [] }
    ];

    const result = getPackagingsRows(packagingInfos);
    expect(result).toEqual([
      { quantity: 2, packagingsLabel: "Fûts 30l" },
      { quantity: 1, packagingsLabel: "Grand Récipient Vrac (GRV) 1000l" }
    ]);
  });

  it("should return correct rows for one packagings with 'other' field", () => {
    const packagingInfos: PackagingInfo[] = [
      {
        type: "AUTRE",
        quantity: 1,
        other: "Caisse plastique",
        volume: null,
        identificationNumbers: []
      }
    ];

    const result = getPackagingsRows(packagingInfos);
    expect(result).toEqual([
      {
        quantity: 1,
        packagingsLabel: "Autre (1 Caisse plastique)"
      }
    ]);
  });

  it("should return correct rows for multiple packagings with 'other' field", () => {
    const packagingInfos: PackagingInfo[] = [
      {
        type: "AUTRE",
        quantity: 2,
        other: "Caisse plastique",
        volume: 20,
        identificationNumbers: []
      },
      {
        type: "AUTRE",
        quantity: 3,
        other: "Tupperware",
        volume: null,
        identificationNumbers: []
      }
    ];

    const result = getPackagingsRows(packagingInfos);
    expect(result).toEqual([
      {
        quantity: 5,
        packagingsLabel: "Autres (2 Caisse plastique x 20l, 3 Tupperware)"
      }
    ]);
  });

  it("should return correct rows for packaging type 'BENNE' with volume in m3", () => {
    const packagingInfos: PackagingInfo[] = [
      { type: "BENNE", quantity: 1, volume: 20000, identificationNumbers: [] }
    ];

    const result = getPackagingsRows(packagingInfos);
    expect(result).toEqual([{ quantity: 1, packagingsLabel: "Benne 20m3" }]);
  });

  it("should handle empty packagingInfos array", () => {
    const packagingInfos: PackagingInfo[] = [];

    const result = getPackagingsRows(packagingInfos);
    expect(result).toEqual([]);
  });
});
