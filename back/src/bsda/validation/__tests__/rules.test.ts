import type {
  CompanyInput,
  BsdaRecepisseInput,
  PickupSiteInput,
  BsdaEmitterInput,
  BsdaReceptionInput,
  BsdaNextDestinationInput,
  BsdaOperationInput,
  BsdaDestinationInput,
  BsdaWasteInput,
  BsdaPackagingInput,
  BsdaWeightInput,
  BsdaWorkerCertificationInput,
  BsdaWorkInput,
  BsdaWorkerInput,
  BsdaBrokerInput,
  BsdaTransportInput,
  BsdaTransporterInput,
  EcoOrganismeInput,
  BsdaInput
} from "@td/codegen-back";
import { flattenBsdaInput } from "../../converter";
import { bsdaEditionRules } from "../rules";

describe("rules", () => {
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
      omiNumber: "",
      extraEuropeanId: ""
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
      mode: null,
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
      customInfo: "OPERATION"
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
      intermediaries: [],
      transporters: []
    };
    const flatInput = flattenBsdaInput(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(bsdaEditionRules)).toContain(key);
    }
  });
});
