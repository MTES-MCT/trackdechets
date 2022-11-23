import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { BsffType, TransportMode } from "generated/graphql/types";

const initialState = {
  type: BsffType.CollectePetitesQuantites,
  emitter: {
    company: getInitialCompany(),
  },
  transporter: {
    company: {
      ...getInitialCompany(),
      vatNumber: "",
    },
    isExemptedOfRecepisse: false,
    recepisse: {
      number: "",
      department: "",
      validityLimit: "",
    },
    transport: {
      mode: TransportMode.Road,
      plates: [],
    },
  },
  destination: {
    company: getInitialCompany(),
    cap: "",
    plannedOperationCode: "",
  },
  packagings: [],
  waste: {
    code: "14 06 01*",
    description: "",
    adr: "UN 1078, Gaz frigorifique NSA (Gaz réfrigérant, NSA), 2.2 (C/E)",
  },
  weight: {
    value: 0,
    isEstimate: true,
  },
  ficheInterventions: [],
  previousPackagings: [],
};

export default initialState;
