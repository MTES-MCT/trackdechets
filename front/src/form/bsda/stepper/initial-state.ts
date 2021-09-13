import { getInitialCompany } from "form/bsdd/utils/initial-state";
import {
  BsdaConsistence,
  QuantityType,
  TransportMode,
} from "generated/graphql/types";

export default {
  emitter: {
    company: getInitialCompany(),
    isPrivateIndividual: false,
    workSite: null,
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
  quantity: {
    type: QuantityType.Estimated,
    value: null,
  },
  worker: {
    company: getInitialCompany(),
    work: {
      hasEmitterPaperSignature: false,
    },
  },
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
      plates: [],
      mode: TransportMode.Road,
    },
  },
  broker: {
    company: getInitialCompany(),
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
};
