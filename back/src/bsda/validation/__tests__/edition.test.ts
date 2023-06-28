import { Bsda } from "@prisma/client";
import {
  BsdaBrokerInput,
  BsdaDestinationInput,
  BsdaEmitterInput,
  BsdaInput,
  BsdaNextDestinationInput,
  BsdaOperationInput,
  BsdaPackagingInput,
  BsdaRecepisseInput,
  BsdaReceptionInput,
  BsdaTransporterInput,
  BsdaTransportInput,
  BsdaWasteInput,
  BsdaWeightInput,
  BsdaWorkerCertificationInput,
  BsdaWorkerInput,
  BsdaWorkInput,
  CompanyInput,
  EcoOrganismeInput,
  PickupSiteInput
} from "../../../generated/graphql/types";
import { flattenBsdaInput } from "../../converter";
import { isAwaitingSignature } from "../edition";
import { editionRules } from "../rules";

describe("edition", () => {
  test("an edition rule should be defined for every key in BsdaInput", () => {
    // Create a dummy BSDA input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to BSDA input so that we think of adding an entry to the edition rules

    const company: Required<CompanyInput> = {
      siret: "",
      vatNumber: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: "",
      country: "",
      omiNumber: ""
    };

    const recepisse: Required<
      Omit<BsdaRecepisseInput, "number" | "department" | "validityLimit">
    > = {
      isExempted: true
    };

    const pickupSite: Required<PickupSiteInput> = {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: ""
    };

    const emitter: Required<BsdaEmitterInput> = {
      isPrivateIndividual: false,
      company,
      pickupSite,
      customInfo: ""
    };

    const reception: Required<BsdaReceptionInput> = {
      date: new Date(),
      weight: 1,
      acceptationStatus: "ACCEPTED",
      refusalReason: ""
    };

    const nextDestination: Required<BsdaNextDestinationInput> = {
      company,
      cap: "",
      plannedOperationCode: ""
    };

    const operation: Required<BsdaOperationInput> = {
      code: "",
      description: "",
      date: new Date(),
      nextDestination
    };

    const destination: Required<BsdaDestinationInput> = {
      company,
      cap: "",
      plannedOperationCode: "",
      reception,
      operation,
      customInfo: "OPEATION"
    };

    const waste: Required<BsdaWasteInput> = {
      code: "",
      name: "",
      familyCode: "",
      materialName: "",
      consistence: "SOLIDE",
      sealNumbers: [],
      adr: "WORK",
      pop: false
    };

    const packaging: Required<BsdaPackagingInput> = {
      other: "",
      quantity: 1,
      type: "BIG_BAG"
    };

    const weight: Required<BsdaWeightInput> = { value: 1, isEstimate: true };

    const certification: Required<BsdaWorkerCertificationInput> = {
      hasSubSectionFour: false,
      hasSubSectionThree: false,
      certificationNumber: "",
      validityLimit: new Date(),
      organisation: ""
    };

    const work: Required<BsdaWorkInput> = {
      hasEmitterPaperSignature: false
    };

    const worker: Required<BsdaWorkerInput> = {
      isDisabled: false,
      company,
      certification,
      work
    };

    const broker: Required<BsdaBrokerInput> = {
      company,
      recepisse
    };

    const transport: Required<BsdaTransportInput> = {
      mode: "ROAD",
      plates: [],
      takenOverAt: new Date()
    };

    const transporter: Required<BsdaTransporterInput> = {
      company,
      customInfo: "",
      recepisse,
      transport
    };

    const ecoOrganisme: Required<EcoOrganismeInput> = { name: "", siret: "" };

    const input: Required<BsdaInput> = {
      type: "COLLECTION_2710",
      emitter,
      destination,
      waste,
      packagings: [packaging],
      weight,
      worker,
      broker,
      transporter,
      ecoOrganisme,
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
