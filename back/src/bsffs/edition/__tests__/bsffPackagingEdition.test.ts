import { BsffPackaging } from "@prisma/client";
import {
  BsffPackagingAcceptationInput,
  BsffPackagingNextDestinationInput,
  BsffPackagingOperationInput,
  CompanyInput,
  UpdateBsffPackagingInput
} from "@td/codegen-back";
import { flattenBsffPackagingInput } from "../../converter";
import { editionRules, isAwaitingSignature } from "../bsffPackagingEdition";

describe("edition", () => {
  test("an edition rule should be defined for every key in BsffInput", () => {
    // Create a dummy UpdateBsffPackagingInput input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to UpdateBsffPackagingInput input so that we think of adding an entry to the edition rules

    const company: Required<CompanyInput> = {
      siret: "",
      name: "",
      address: "",
      contact: "",
      phone: "",
      mail: "",
      vatNumber: "",
      omiNumber: "",
      country: "",
      extraEuropeanId: ""
    };

    const acceptation: Required<BsffPackagingAcceptationInput> = {
      date: new Date(),
      weight: 1,
      status: "ACCEPTED",
      wasteCode: "",
      wasteDescription: "",
      refusalReason: ""
    };

    const nextDestination: Required<BsffPackagingNextDestinationInput> = {
      plannedOperationCode: "R2",
      cap: "",
      company
    };

    const operation: Required<BsffPackagingOperationInput> = {
      date: new Date(),
      code: "D13",
      mode: null,
      description: "",
      nextDestination,
      noTraceability: false
    };

    const input: Required<UpdateBsffPackagingInput> = {
      numero: "1234",
      acceptation,
      operation
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
