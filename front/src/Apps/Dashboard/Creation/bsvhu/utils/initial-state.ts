/* eslint-disable import/no-anonymous-default-export */

import { BsvhuCompanyInput } from "@td/codegen-ui";
import { getInitialCompany } from "../../../../common/data/initialState";

const getInitialEmitterCompany = (company?: BsvhuCompanyInput | null) => {
  return {
    siret: company?.siret ?? "",
    name: company?.name ?? "",
    address: company?.address ?? "",
    city: company?.city ?? "",
    street: company?.street ?? "",
    postalCode: company?.postalCode ?? "",
    contact: company?.contact ?? "",
    mail: company?.mail ?? "",
    phone: company?.phone ?? "",
    vatNumber: company?.vatNumber ?? "",
    country: company?.country ?? "",
    omiNumber: company?.omiNumber ?? ""
  };
};

export default {
  customId: "",
  emitter: {
    company: getInitialEmitterCompany(),
    agrementNumber: "",
    emission: {
      signature: {
        author: null,
        date: null
      }
    },
    irregularSituation: false,
    noSiret: false
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
    type: null
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
  },
  ecoOrganisme: {
    name: "",
    siret: ""
  },
  broker: {
    company: getInitialCompany()
  },
  trader: {
    company: getInitialCompany()
  },
  intermediaries: [getInitialCompany()]
};

export const ecoOrganismeList = [
  { siret: "92474564900013", name: "Recycler mon véhicule" }
];
