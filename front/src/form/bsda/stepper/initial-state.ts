import { getInitialCompany } from "form/bsdd/utils/initial-state";
import {
  BsdaConsistence,
  BsdaType,
  TransportMode,
} from "generated/graphql/types";

export default {
  type: BsdaType.OtherCollections,
  emitter: {
    company: getInitialCompany(),
    isPrivateIndividual: false,
    pickupSite: null,
  },
  waste: {
    code: "",
    name: "",
    familyCode: "",
    materialName: "",
    consistence: BsdaConsistence.Solide,
    sealNumbers: [],
    adr: "",
  },
  packagings: [],
  weight: {
    isEstimate: false,
    value: null,
  },
  worker: {
    company: getInitialCompany(),
    work: {
      hasEmitterPaperSignature: false,
    },
  },
  broker: null,
  transporter: {
    company: {
      ...getInitialCompany(),
      vatNumber: "",
    },
    recepisse: {
      number: "",
      department: "",
      validityLimit: null,
    },
    transport: {
      takenOverAt: null,
      plates: [],
      mode: TransportMode.Road,
    },
  },
  destination: {
    cap: "",
    plannedOperationCode: "",
    company: getInitialCompany(),
    operation: {
      nextDestination: {
        company: getInitialCompany(),
      },
    },
  },
  grouping: [],
  forwarding: null,
};
