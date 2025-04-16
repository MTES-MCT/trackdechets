import {
  CompanyInput,
  BsdasriRecepisseInput,
  BsdasriEmitterInput,
  BsdasriReceptionInput,
  BsdasriOperationInput,
  BsdasriPackagingsInput,
  BsdasriTransportInput,
  BsdasriInput,
  BsdaDestinationInput,
  BsdasriEmissionInput,
  BsdasriTransporterInput,
  PickupSiteInput,
  BsdasriWasteInput,
  BsdasriEcoOrganismeInput
} from "@td/codegen-back";
import { flattenBsdasriInput } from "../../converter";
import { bsdasriEditionRules } from "../rules";

describe("rules", () => {
  test("an edition rule should be defined for every key in BsdasriInput", () => {
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
    const packagings: Required<BsdasriPackagingsInput> = {
      other: "",
      quantity: 1,
      type: "BOITE_CARTON",
      volume: 1
    };
    const recepisse: Required<
      Omit<BsdasriRecepisseInput, "number" | "department" | "validityLimit">
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
    const emission: Required<BsdasriEmissionInput> = {
      weight: { isEstimate: false, value: 1 },
      packagings: [packagings]
    };
    const emitter: Required<BsdasriEmitterInput> = {
      company,

      customInfo: "",

      pickupSite,
      emission
    };

    const reception: Required<BsdasriReceptionInput> = {
      date: new Date(),
      packagings: [packagings],
      acceptation: { status: "ACCEPTED" }
    };

    const operation: Required<BsdasriOperationInput> = {
      code: "",
      mode: null,
      weight: { value: 1 },
      date: new Date()
    };

    const destination: Required<BsdaDestinationInput> = {
      company,
      cap: "cap",
      plannedOperationCode: "",
      reception,
      operation,
      customInfo: "OPERATION"
    };

    const transport: Required<BsdasriTransportInput> = {
      mode: "ROAD",
      plates: [],
      acceptation: { status: "ACCEPTED" },
      packagings: [packagings],
      takenOverAt: new Date(),
      handedOverAt: new Date(),
      weight: { value: 1, isEstimate: true }
    };

    const transporter: Required<BsdasriTransporterInput> = {
      company,

      customInfo: "TRANSPORTER",
      recepisse,
      transport
    };

    const ecoOrganisme: Required<BsdasriEcoOrganismeInput> = {
      name: "",
      siret: ""
    };
    const waste: Required<BsdasriWasteInput> = {
      adr: "",
      code: ""
    };
    const input: Required<BsdasriInput> = {
      waste,
      emitter,
      transporter,
      destination,
      ecoOrganisme,
      identification: { numbers: ["a"] },
      grouping: [],
      synthesizing: []
    };

    const flatInput = flattenBsdasriInput(input);

    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(bsdasriEditionRules)).toContain(key);
    }
  });
});
