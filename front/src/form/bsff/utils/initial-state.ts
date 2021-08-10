import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { TransportMode } from "generated/graphql/types";

export default {
  emitter: {
    company: getInitialCompany(),
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
      mode: TransportMode.Road,
    },
  },
  destination: {
    company: getInitialCompany(),
    cap: "",
    plannedOperation: {
      code: "",
    },
  },
  packagings: [],
  waste: {
    code: "14 06 01*",
    nature: null,
    adr: "UN 1078, Gaz frigorifique NSA (Gaz réfrigérant, NSA), 2.2 (C/E)",
  },
  quantity: {
    kilos: 0,
    isEstimate: false,
  },
  ficheInterventions: [],
};
