import { initialCompany } from "form/initial-state";

export default {
  isDraft: true,
  emitter: {
    company: initialCompany,
    agrementNumber: "",
  },
  recipient: {
    type: "BROYEUR",
    company: initialCompany,
    agrementNumber: "",
    operation: { planned: "R 4" },
    plannedBroyeurCompany: initialCompany,
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
    company: initialCompany,
    tvaIntracommunautaire: "",
    recepisse: {
      number: "",
      department: "",
      validityLimit: null,
    },
  },
};
