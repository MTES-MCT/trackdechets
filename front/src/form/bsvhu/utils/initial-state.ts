import { getInitialCompany } from "form/bsdd/utils/initial-state";

export default {
  emitter: {
    company: getInitialCompany(),
    agrementNumber: "",
  },
  destination: {
    type: "BROYEUR",
    company: getInitialCompany(),
    agrementNumber: "",
    plannedOperationCode: "R 4",
    reception: {
      date: null,
      acceptationStatus: null,
      refusalReason: "",
      quantity: null,
      identification: {
        numbers: [],
      },
    },
    operation: {
      date: null,
      code: "",
      nextDestination: { company: getInitialCompany() },
    },
  },
  packaging: "UNITE",
  wasteCode: "16 01 06",
  identification: {
    numbers: [],
    type: "NUMERO_ORDRE_REGISTRE_POLICE",
  },
  quantity: null,
  weight: {
    value: null,
    isEstimate: false,
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
};
