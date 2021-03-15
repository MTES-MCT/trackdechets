import { getInitialCompany } from "form/bsdd/utils/initial-state";

export default {
  isDraft: true,
  emitter: {
    company: getInitialCompany(),
    agrementNumber: "",
  },
  recipient: {
    type: "BROYEUR",
    company: getInitialCompany(),
    agrementNumber: "",
    operation: { planned: "R 4" },
    plannedBroyeurCompany: getInitialCompany(),
  },
  packaging: "UNITE",
  wasteCode: "16 01 06",
  identification: {
    numbers: [],
    type: "NUMERO_ORDRE_REGISTRE_POLICE",
  },
  quantity: {
    number: null,
    tons: null,
  },
  transporter: {
    company: getInitialCompany(),
    tvaIntracommunautaire: "",
    recepisse: {
      number: "",
      department: "",
      validityLimit: null,
    },
  },
};
