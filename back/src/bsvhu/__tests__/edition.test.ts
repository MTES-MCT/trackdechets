import { Bsvhu } from "@prisma/client";
import {
  BsvhuDestinationInput,
  BsvhuDestinationType,
  BsvhuEmitterInput,
  BsvhuIdentificationInput,
  BsvhuInput,
  BsvhuNextDestinationInput,
  BsvhuOperationInput,
  BsvhuRecepisseInput,
  BsvhuReceptionInput,
  BsvhuTransporterInput,
  BsvhuTransportInput,
  BsvhuWeightInput,
  CompanyInput
} from "../../generated/graphql/types";
import { flattenVhuInput } from "../converter";
import { editionRules, isAwaitingSignature } from "../edition";

describe("edition", () => {
  test("an edition rule should be defined for every key in BsdaInput", () => {
    // Create a dummy BSDVHU input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to BsvhuInput so that we think of adding an entry to the edition rules

    const company: Required<CompanyInput> = {
      siret: "",
      vatNumber: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: "",
      country: "",
      omiNumber: "",
      extraEuropeanId: ""
    };

    const recepisse: Required<
      Omit<BsvhuRecepisseInput, "number" | "department" | "validityLimit">
    > = {
      isExempted: true
    };

    const emitter: Required<BsvhuEmitterInput> = {
      agrementNumber: "",
      company
    };

    const identification: Required<BsvhuIdentificationInput> = {
      numbers: [],
      type: "NUMERO_ORDRE_REGISTRE_POLICE"
    };

    const weight: Required<BsvhuWeightInput> = {
      value: 1,
      isEstimate: false
    };

    const transport: Required<BsvhuTransportInput> = {
      takenOverAt: new Date()
    };
    const transporter: Required<BsvhuTransporterInput> = {
      company,
      recepisse,
      transport
    };

    const reception: Required<BsvhuReceptionInput> = {
      acceptationStatus: "ACCEPTED",
      date: new Date(),
      refusalReason: "",
      weight: 1,
      identification,
      quantity: 1
    };

    const nextDestination: Required<BsvhuNextDestinationInput> = {
      company
    };

    const operation: Required<BsvhuOperationInput> = {
      code: "",
      mode: null,
      date: new Date(),
      nextDestination
    };

    const destination: Required<BsvhuDestinationInput> = {
      type: "BROYEUR" as BsvhuDestinationType,
      agrementNumber: "",
      plannedOperationCode: "",
      company,
      reception,
      operation
    };

    const input: Required<BsvhuInput> = {
      emitter,
      wasteCode: "",
      packaging: "UNITE",
      identification,
      quantity: 1,
      weight,
      transporter,
      destination
    };
    const flatInput = flattenVhuInput(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(editionRules)).toContain(key);
    }
  });

  test("isAwaitingSignature should recursively checks the signature hierarchy", () => {
    const bsvhu = {
      emitterEmissionSignatureDate: null,
      transporterTransportSignatureDate: null,
      destinationOperationSignatureDate: null
    } as Bsvhu;
    expect(isAwaitingSignature("EMISSION", bsvhu)).toEqual(true);
    expect(isAwaitingSignature("TRANSPORT", bsvhu)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", bsvhu)).toEqual(true);
    const afterEmission = {
      ...bsvhu,
      emitterEmissionSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterEmission)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterEmission)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", afterEmission)).toEqual(true);
    const afterTransport = {
      ...afterEmission,
      transporterTransportSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterTransport)).toEqual(true);
    const afterOperation = {
      ...afterTransport,
      destinationOperationSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterOperation)).toEqual(false);
  });
});
