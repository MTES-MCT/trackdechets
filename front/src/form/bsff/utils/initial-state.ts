import { addYears, startOfYear } from "date-fns";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { BsffType, TransportMode } from "generated/graphql/types";

const initialState = {
  type: BsffType.TracerFluide,
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
      validityLimit: startOfYear(addYears(new Date(), 1)).toISOString(),
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
    description: null,
    adr: "UN 1078, Gaz frigorifique NSA (Gaz réfrigérant, NSA), 2.2 (C/E)",
  },
  weight: {
    value: 0,
    isEstimate: false,
  },
  ficheInterventions: [],
  previousBsffs: [],
};

export default initialState;
