import { Bsda } from "@prisma/client";
import { BsdaInput } from "../../generated/graphql/types";
import { flattenBsdaInput } from "../converter";
import { editionRules, isAwaitingSignature } from "../edition";

describe("edition", () => {
  test("an edition rule should be defined for every key in BsdaInput", () => {
    // Create a dummy BSDA input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to BSDA input so that we think of adding an entry to the edition rules
    const input: Required<BsdaInput> = {
      type: "COLLECTION_2710",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: "",
          vatNumber: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
          country: "",
          omiNumber: ""
        },
        pickupSite: {
          name: "",
          address: "",
          city: "",
          postalCode: "",
          infos: ""
        },
        customInfo: ""
      },
      destination: {
        company: {
          siret: "",
          vatNumber: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
          country: "",
          omiNumber: ""
        },
        cap: "",
        plannedOperationCode: "",
        reception: {
          date: new Date(),
          weight: 1,
          acceptationStatus: "ACCEPTED",
          refusalReason: ""
        },
        operation: {
          code: "",
          description: "",
          date: new Date(),
          nextDestination: {
            company: {
              siret: "",
              vatNumber: "",
              name: "",
              address: "",
              contact: "",
              mail: "",
              phone: "",
              country: "",
              omiNumber: ""
            },
            cap: "",
            plannedOperationCode: ""
          }
        },
        customInfo: "OPEATION"
      },
      waste: {
        code: "",
        name: "",
        familyCode: "",
        materialName: "",
        consistence: "SOLIDE",
        sealNumbers: [],
        adr: "WORK",
        pop: false
      },
      packagings: [],
      weight: { value: 1, isEstimate: true },
      worker: {
        isDisabled: false,
        company: {
          siret: "",
          vatNumber: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
          country: "",
          omiNumber: ""
        },
        certification: {
          hasSubSectionFour: false,
          hasSubSectionThree: false,
          certificationNumber: "",
          validityLimit: new Date(),
          organisation: ""
        },
        work: {
          hasEmitterPaperSignature: false
        }
      },
      broker: {
        company: {
          siret: "",
          vatNumber: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
          country: "",
          omiNumber: ""
        },
        recepisse: {
          isExempted: true,
          number: "",
          department: "",
          validityLimit: new Date()
        }
      },
      transporter: {
        company: {
          siret: "",
          vatNumber: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
          country: "",
          omiNumber: ""
        },
        customInfo: "",
        recepisse: {
          isExempted: true,
          number: "",
          department: "",
          validityLimit: new Date()
        },
        transport: {
          mode: "ROAD",
          plates: [],
          takenOverAt: new Date()
        }
      },
      ecoOrganisme: { name: "", siret: "" },
      forwarding: "",
      grouping: [],
      intermediaries: []
    };
    const flatInput = flattenBsdaInput(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(editionRules)).toContain(key);
    }
  });

  test("isAwaitingSignature should recursively checks the signature hierarchy", () => {
    const bsda = {
      emitterEmissionSignatureDate: null,
      workerWorkSignatureDate: null,
      transporterTransportSignatureDate: null,
      destinationOperationSignatureDate: null
    } as Bsda;
    expect(isAwaitingSignature("EMISSION", bsda)).toEqual(true);
    expect(isAwaitingSignature("WORK", bsda)).toEqual(true);
    expect(isAwaitingSignature("TRANSPORT", bsda)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", bsda)).toEqual(true);
    const afterEmission = {
      ...bsda,
      emitterEmissionSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterEmission)).toEqual(false);
    expect(isAwaitingSignature("WORK", afterEmission)).toEqual(true);
    expect(isAwaitingSignature("TRANSPORT", afterEmission)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", afterEmission)).toEqual(true);
    const afterWork = {
      ...afterEmission,
      workerWorkSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterWork)).toEqual(false);
    expect(isAwaitingSignature("WORK", afterWork)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterWork)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", afterWork)).toEqual(true);
    const afterTransport = {
      ...afterWork,
      transporterTransportSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("WORK", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterTransport)).toEqual(true);
    const afterOperation = {
      ...afterTransport,
      destinationOperationSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("WORK", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterOperation)).toEqual(false);
    const afterTransportWhenEmitterIsPrivateIndividual = {
      ...bsda,
      transporterTransportSignatureDate: new Date()
    };
    expect(
      isAwaitingSignature(
        "EMISSION",
        afterTransportWhenEmitterIsPrivateIndividual
      )
    ).toEqual(false);
    expect(
      isAwaitingSignature("WORK", afterTransportWhenEmitterIsPrivateIndividual)
    ).toEqual(false);
    expect(
      isAwaitingSignature(
        "TRANSPORT",
        afterTransportWhenEmitterIsPrivateIndividual
      )
    ).toEqual(false);
    expect(
      isAwaitingSignature(
        "OPERATION",
        afterTransportWhenEmitterIsPrivateIndividual
      )
    ).toEqual(true);
  });
});
