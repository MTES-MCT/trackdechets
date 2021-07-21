import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { QuantityType } from "generated/graphql/types";

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
    consistence: "",
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
    hasEmitterPaperSignature: false,
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
  },
  broker: {
    company: getInitialCompany(),
  },
  destination: {
    company: getInitialCompany(),
    operation: {
      nextDestination: {
        company: getInitialCompany(),
      },
    },
  },
};
