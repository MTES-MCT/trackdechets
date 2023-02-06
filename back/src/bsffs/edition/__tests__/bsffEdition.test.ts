import { Bsff } from "@prisma/client";
import { BsffInput } from "../../../generated/graphql/types";
import { flattenBsffInput } from "../../converter";
import { editionRules, isAwaitingSignature } from "../bsffEdition";

describe("edition", () => {
  test("an edition rule should be defined for every key in BsffInput", () => {
    // Create a dummy BSFF input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to BSFF input so that we think of adding an entry to the edition rules
    const input: Required<BsffInput> = {
      type: "COLLECTE_PETITES_QUANTITES",
      emitter: {
        company: {
          siret: "",
          name: "",
          address: "",
          contact: "",
          phone: "",
          mail: ""
        }
      },
      packagings: [],
      waste: {
        code: "",
        description: "",
        adr: ""
      },
      weight: {
        value: 1,
        isEstimate: true
      },
      transporter: {
        company: {
          siret: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: ""
        },
        recepisse: {
          number: "XXXX",
          department: "",
          validityLimit: new Date()
        }
      },
      destination: {
        company: {
          siret: "",
          name: "",
          address: "",
          contact: "",
          phone: "",
          mail: ""
        },
        cap: "",
        plannedOperationCode: "D13"
      },
      ficheInterventions: [],
      forwarding: [],
      grouping: [],
      repackaging: []
    };
    const flatInput = flattenBsffInput(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(editionRules)).toContain(key);
    }
  });

  test("isAwaitingSignature should recursively checks the signature hierarchy", () => {
    const bsff = {
      emitterEmissionSignatureDate: null,
      transporterTransportSignatureDate: null,
      destinationOperationSignatureDate: null
    } as Bsff;
    expect(isAwaitingSignature("EMISSION", bsff)).toEqual(true);
    expect(isAwaitingSignature("TRANSPORT", bsff)).toEqual(true);
    expect(isAwaitingSignature("RECEPTION", bsff)).toEqual(true);
    const afterEmission = {
      ...bsff,
      emitterEmissionSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterEmission)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterEmission)).toEqual(true);
    expect(isAwaitingSignature("RECEPTION", afterEmission)).toEqual(true);
    const afterTransport = {
      ...afterEmission,
      transporterTransportSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("RECEPTION", afterTransport)).toEqual(true);
    const afterReception = {
      ...afterTransport,
      destinationReceptionSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterReception)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterReception)).toEqual(false);
    expect(isAwaitingSignature("RECEPTION", afterReception)).toEqual(false);
  });
});
