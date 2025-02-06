import { totalPackagings } from "../helpers";
import { InitialForm, InitialFormFraction, Packagings } from "@td/codegen-ui";

describe("totalPackagings", () => {
  it("should group packagings by type, volume, and other", () => {
    const annexedForms: InitialFormFraction[] = [
      {
        form: {
          wasteDetails: {
            packagingInfos: [
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
              }
            ]
          }
        } as InitialForm,
        quantity: 1
      },
      {
        form: {
          wasteDetails: {
            packagingInfos: [
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
              }
            ]
          }
        } as InitialForm,
        quantity: 1
      },
      {
        form: {
          wasteDetails: {
            packagingInfos: [
              {
                type: Packagings.Autre,
                volume: 20,
                other: "Boite carton",
                quantity: 1,
                identificationNumbers: ["I"]
              }
            ]
          }
        } as InitialForm,
        quantity: 1
      },
      {
        form: {
          wasteDetails: {
            packagingInfos: [
              {
                type: Packagings.Autre,
                volume: 20,
                other: "Boite métallique",
                quantity: 1,
                identificationNumbers: ["J"]
              }
            ]
          }
        } as InitialForm,
        quantity: 1
      }
    ];

    const result = totalPackagings(annexedForms);
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
