import { BsdaEmitterInput, BsdaType, TransportMode } from "@td/codegen-ui";
import { getInitialCompany } from "../../../../common/data/initialState";

const getInitialEmitterCompany = (emitter?: BsdaEmitterInput | null) => {
  return {
    siret: emitter?.company?.siret ?? "",
    name: emitter?.company?.name ?? "",
    address: emitter?.company?.address ?? "",
    city: "",
    street: "",
    postalCode: "",
    contact: emitter?.company?.contact ?? "",
    mail: emitter?.company?.mail ?? "",
    phone: emitter?.company?.phone ?? "",
    vatNumber: emitter?.company?.vatNumber ?? "",
    country: emitter?.company?.country ?? "",
    omiNumber: emitter?.company?.omiNumber ?? ""
  };
};

export default {
  emitter: {
    company: getInitialEmitterCompany(),
    isPrivateIndividual: false,
    customInfo: "",
    pickupSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: ""
    },
    emission: {
      signature: {
        author: null,
        date: null
      }
    }
  },
  ecoOrganisme: null,
  waste: {
    code: "",
    familyCode: "",
    materialName: "",
    consistence: null,
    consistenceDescription: null,
    sealNumbers: [],
    isSubjectToADR: false,
    adr: null,
    nonRoadRegulationMention: null,
    pop: false
  },
  packagings: [],
  weight: {
    isEstimate: false,
    value: null
  },
  broker: {
    company: getInitialCompany()
  },
  destination: {
    company: getInitialCompany(),
    cap: null,
    plannedOperationCode: null,
    customInfo: null,
    reception: {
      date: null,
      weight: null,
      refusedWeight: null,
      acceptationStatus: null,
      refusalReason: null,
      signature: {
        author: null,
        date: null
      }
    },
    operation: {
      code: null,
      mode: null,
      description: null,
      date: null,
      signature: {
        author: null,
        date: null
      },
      nextDestination: {
        company: getInitialCompany(),
        cap: null,
        plannedOperationCode: null
      }
    }
  },
  worker: {
    isDisabled: false,
    company: getInitialCompany(),
    certification: {
      hasSubSectionFour: null,
      hasSubSectionThree: null,
      certificationNumber: null,
      validityLimit: null,
      organisation: null
    },
    work: {
      hasEmitterPaperSignature: false,
      signature: {
        author: null,
        date: null
      }
    }
  },
  transporters: [
    {
      transport: {
        mode: TransportMode.Road,
        plates: []
      }
    }
  ],
  grouping: [],
  forwarding: null,
  intermediaries: [getInitialCompany()],
  intermediariesOrgIds: [],
  transportersOrgIds: [],
  type: BsdaType.OtherCollections
};
