import { addYears, startOfYear } from "date-fns";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { BsffType, TransportMode } from "generated/graphql/types";
import { OPERATION } from "./constants";

export default {
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
    },
  },
  destination: {
    company: getInitialCompany(),
    cap: "",
    plannedOperationCode: OPERATION.R2.code,
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
