import { BsffPackaging } from "@prisma/client";
import { UpdateBsffPackagingInput } from "../../../generated/graphql/types";
import { flattenBsffPackagingInput } from "../../converter";
import { editionRules, isAwaitingSignature } from "../bsffPackagingEdition";

describe("edition", () => {
  test("an edition rule should be defined for every key in BsffInput", () => {
    // Create a dummy UpdateBsffPackagingInput input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to UpdateBsffPackagingInput input so that we think of adding an entry to the edition rules
    const input: Required<UpdateBsffPackagingInput> = {
      acceptation: {
        date: new Date(),
        weight: 1,
        status: "ACCEPTED",
        wasteCode: "",
        wasteDescription: ""
      },
      operation: {
        date: new Date(),
        code: "D13",
        description: "",
        nextDestination: {
          plannedOperationCode: "R2",
          cap: "",
          company: {
            siret: "",
            name: "",
            address: "",
            contact: "",
            phone: "",
            mail: ""
          }
        }
      }
    };
    const flatInput = flattenBsffPackagingInput(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(editionRules)).toContain(key);
    }
  });

  test("isAwaitingSignature should recursively checks the signature hierarchy", () => {
    const bsffPackaging = {
      acceptationSignatureDate: null,
      operationSignatureDate: null
    } as BsffPackaging;
    expect(isAwaitingSignature("ACCEPTATION", bsffPackaging)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", bsffPackaging)).toEqual(true);
    const afterAcceptation = {
      ...bsffPackaging,
      acceptationSignatureDate: new Date()
    };
    expect(isAwaitingSignature("ACCEPTATION", afterAcceptation)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterAcceptation)).toEqual(true);
    const afterOperation = {
      ...afterAcceptation,
      operationSignatureDate: new Date()
    };
    expect(isAwaitingSignature("ACCEPTATION", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterOperation)).toEqual(false);
  });
});
