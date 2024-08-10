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
import { bsvhuEditionRules } from "../validation/rules";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsvhu,
  prismaToZodBsvhu
} from "../validation/helpers";
import { bsvhuFactory } from "./factories.vhu";

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
      irregularSituation: false,
      noSiret: false,
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
    const flatInput = graphQlInputToZodBsvhu(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(bsvhuEditionRules)).toContain(key);
    }
  });

  test("getCurrentSignatureType should recursively checks the signature hierarchy", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: { status: "INITIAL" }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const currentSignature = getCurrentSignatureType(bsvhu);
    expect(currentSignature).toEqual(undefined);
    const afterEmission = {
      ...bsvhu,
      emitterEmissionSignatureDate: new Date()
    };
    const currentSignature2 = getCurrentSignatureType(afterEmission);
    expect(currentSignature2).toEqual("EMISSION");
    const afterTransport = {
      ...afterEmission,
      transporterTransportSignatureDate: new Date()
    };
    const currentSignature3 = getCurrentSignatureType(afterTransport);
    expect(currentSignature3).toEqual("TRANSPORT");
    const afterOperation = {
      ...afterTransport,
      destinationOperationSignatureDate: new Date()
    };
    const currentSignature4 = getCurrentSignatureType(afterOperation);
    expect(currentSignature4).toEqual("OPERATION");
  });
});
