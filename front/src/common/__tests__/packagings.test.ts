import { Packagings } from "@td/codegen-ui";
import { mergePackagings } from "../packagings";

describe("mergePackagings", () => {
  it("should group packagings by type, volume, and other", () => {
    const result = mergePackagings([
      {
        type: Packagings.Fut,
        volume: 20,
        other: null,
        quantity: 2,
        identificationNumbers: ["A", "B"]
      },
      {
        type: Packagings.Fut,
        volume: 30,
        other: null,
        quantity: 1,
        identificationNumbers: ["C"]
      },
      {
        type: Packagings.Grv,
        volume: 30,
        other: null,
        quantity: 1,
        identificationNumbers: ["D"]
      },
      {
        type: Packagings.Fut,
        volume: 20,
        other: null,
        quantity: 3,
        identificationNumbers: ["E", "F", "G"]
      },
      {
        type: Packagings.Autre,
        volume: 20,
        other: "Boite carton",
        quantity: 1,
        identificationNumbers: ["H"]
      },
      {
        type: Packagings.Autre,
        volume: 20,
        other: "Boite carton",
        quantity: 1,
        identificationNumbers: ["I"]
      },
      {
        type: Packagings.Autre,
        volume: 20,
        other: "Boite métallique",
        quantity: 1,
        identificationNumbers: ["J"]
      }
    ]);
    expect(result).toEqual([
      {
        type: "FUT",
        volume: 20,
        other: null,
        quantity: 5,
        identificationNumbers: ["A", "B", "E", "F", "G"]
      },
      {
        type: "FUT",
        volume: 30,
        other: null,
        quantity: 1,
        identificationNumbers: ["C"]
      },
      {
        type: "GRV",
        volume: 30,
        other: null,
        quantity: 1,
        identificationNumbers: ["D"]
      },
      {
        type: "AUTRE",
        volume: 20,
        other: "Boite carton",
        quantity: 2,
        identificationNumbers: ["H", "I"]
      },
      {
        type: "AUTRE",
        volume: 20,
        other: "Boite métallique",
        quantity: 1,
        identificationNumbers: ["J"]
      }
    ]);
  });
});
