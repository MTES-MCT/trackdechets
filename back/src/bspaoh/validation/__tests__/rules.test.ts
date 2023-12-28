import {
  BspaohWasteAcceptationInput,
  BspaohWasteDetailInput,
  CompanyInput,
  BspaohRecepisseInput,
  PickupSiteInput,
  BspaohEmitterInput,
  BspaohReceptionInput,
  BspaohOperationInput,
  BspaohDestinationInput,
  BspaohWasteInput,
  BspaohPackagingInput,
  BspaohEmissionInput,
  BspaohTransportInput,
  BspaohTransporterInput,
  BspaohHandedOverToDestinationInput,
  BspaohWasteWeightInput,
  BspaohPackagingAcceptationInput,
  BspaohInput
} from "../../../generated/graphql/types";
import { flattenBspaohInput } from "../../converter";
import { editionRules } from "../rules";

describe("rules", () => {
  test("an edition rule should be defined for every key in BspaohInput", () => {
    // Create a dummy BSPAOH input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to BSPAOH input so that we think of adding an entry to the edition rules

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
    const weight: Required<BspaohWasteWeightInput> = {
      value: 1,
      isEstimate: true
    };

    const recepisse: Required<
      Omit<BspaohRecepisseInput, "number" | "department" | "validityLimit">
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

    const detail: Required<BspaohWasteDetailInput> = {
      weight,
      quantity: 3
    };
    const emission: Required<BspaohEmissionInput> = {
      detail
    };
    const emitter: Required<BspaohEmitterInput> = {
      company,
      pickupSite,
      customInfo: "",
      emission
    };

    const packagingAcceptation: Required<BspaohPackagingAcceptationInput> = {
      id: "x",
      acceptation: "ACCEPTED"
    };
    const acceptation: Required<BspaohWasteAcceptationInput> = {
      status: "ACCEPTED",

      refusalReason: "",

      packagings: [packagingAcceptation]
    };
    const reception: Required<BspaohReceptionInput> = {
      date: new Date(),
      detail,
      acceptation
    };

    const operation: Required<BspaohOperationInput> = {
      code: "",
      mode: null,
      date: new Date()
    };

    const handedOverToDestination: Required<BspaohHandedOverToDestinationInput> =
      { date: new Date() };

    const destination: Required<BspaohDestinationInput> = {
      company,
      cap: "",
      handedOverToDestination,
      reception,
      operation,
      customInfo: ""
    };
    const packaging: Required<BspaohPackagingInput> = {
      type: "BIG_BOX",

      volume: 1,

      containerNumber: "abc",

      quantity: 1,

      identificationCodes: ["xyz"],

      consistence: "SOLIDE"
    };
    const waste: Required<BspaohWasteInput> = {
      type: "PAOH",
      code: "",
      adr: "adr",
      packagings: [packaging]
    };

    const transport: Required<BspaohTransportInput> = {
      mode: "ROAD",
      plates: [],
      takenOverAt: new Date()
    };

    const transporter: Required<BspaohTransporterInput> = {
      company,
      customInfo: "",
      recepisse,
      transport
    };

    const input: Required<BspaohInput> = {
      emitter,
      waste,
      transporter,
      destination
    };
    // denormalized field(s) not subject to validaiton rules
    const exceptions = ["transporterTransportTakenOverAt"];

    const flatInput = flattenBspaohInput(input);
    const keys = Object.keys(flatInput).filter(f => !exceptions.includes(f));
    for (const key of keys) {
      expect(Object.keys(editionRules)).toContain(key);
    }
  });
});
