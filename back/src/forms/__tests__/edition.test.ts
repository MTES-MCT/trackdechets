import {
  BrokerInput,
  CompanyInput,
  DestinationInput,
  EcoOrganismeInput,
  EmitterInput,
  RecipientInput,
  TemporaryStorageDetailInput,
  TraderInput,
  TransporterInput,
  UpdateFormInput,
  WasteDetailsInput,
  WorkSiteInput
} from "../../generated/graphql/types";
import { flattenFormInput } from "../converter";
import { editionRules } from "../edition";

describe("edition", () => {
  test("an edition rule should be defined for every key in UpdateFormInput", () => {
    // Create a dummy BSDD update input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to BSDD input so that we think of adding an entry to the edition rules

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

    const workSite: Required<WorkSiteInput> = {
      address: "",
      city: "",
      infos: "",
      name: "",
      postalCode: ""
    };

    const emitter: Required<EmitterInput> = {
      type: "PRODUCER",
      company,
      workSite,
      pickupSite: "",
      isPrivateIndividual: false,
      isForeignShip: false
    };

    const recipient: Required<RecipientInput> = {
      cap: "",
      processingOperation: "",
      company,
      isTempStorage: false
    };

    const transporter: Required<
      Omit<TransporterInput, "department" | "validityLimit" | "receipt">
    > = {
      company,
      isExemptedOfReceipt: false,
      numberPlate: "",
      customInfo: "",
      mode: "ROAD"
    };

    const wasteDetails: Required<WasteDetailsInput> = {
      code: "R1",
      name: "",
      onuCode: "",
      packagingInfos: [],
      packagings: [],
      otherPackaging: "",
      numberOfPackages: 1,
      quantity: 1,
      quantityType: "REAL",
      consistence: "SOLID",
      pop: false,
      isDangerous: true,
      parcelNumbers: [],
      analysisReferences: [],
      landIdentifiers: [],
      sampleNumber: ""
    };

    const trader: Required<TraderInput> = {
      receipt: "",
      department: "",
      validityLimit: new Date(),
      company
    };

    const broker: Required<BrokerInput> = {
      receipt: "",
      department: "",
      validityLimit: new Date(),
      company
    };

    const ecoOrganisme: Required<EcoOrganismeInput> = { name: "", siret: "" };

    const destination: Required<DestinationInput> = {
      company,
      cap: "",
      processingOperation: "",
      isFilledByEmitter: false
    };

    const temporaryStorageDetail: Required<TemporaryStorageDetailInput> = {
      destination
    };

    const input: Required<UpdateFormInput> = {
      id: "",
      customId: "",
      emitter,
      recipient,
      transporter,
      wasteDetails,
      trader,
      broker,
      appendix2Forms: [],
      grouping: [],
      ecoOrganisme,
      temporaryStorageDetail,
      intermediaries: [],
      transporters: []
    };
    const flatInput = flattenFormInput(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(editionRules)).toContain(key);
    }
  });
});
