/* eslint-disable import/no-anonymous-default-export */

import { getInitialCompany } from "../../../../common/data/initialState";

export default {
  emitter: {
    company: getInitialCompany(),
    agrementNumber: "",
    emission: {
      signature: {
        author: null,
        date: null
      }
    }
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
      weight: null,
      quantity: null,
      identification: {
        numbers: []
      }
    },
    operation: {
      date: null,
      code: "",
      mode: null,
      nextDestination: { company: getInitialCompany() }
    }
  },
  packaging: "UNITE",
  wasteCode: "16 01 06",
  identification: {
    numbers: [],
    type: "NUMERO_ORDRE_REGISTRE_POLICE"
  },
  quantity: null,
  weight: {
    value: null,
    isEstimate: false
  },
  transporter: {
    company: {
      ...getInitialCompany()
    },
    recepisse: {
      isExempted: false
    },
    transport: {
      signature: {
        author: null,
        takenOverAt: null
      }
    }
  }
};
