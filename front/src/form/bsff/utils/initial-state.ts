import { getInitialCompany } from "form/bsdd/utils/initial-state";
import {
  BsffInput,
  BsffOperationCode,
  BsffPackagingInput,
  BsffTransporterInput,
  BsffType,
  TransportMode,
} from "generated/graphql/types";

export interface BsffFormTransporterInput extends BsffTransporterInput {
  isExemptedOfRecepisse: boolean;
}

export interface BsffFormInput extends BsffInput {
  transporter: BsffFormTransporterInput;
  previousPackagings: BsffPackagingInput[];
}

// BsffInput with specific form values
const initialState: BsffFormInput = {
  type: BsffType.CollectePetitesQuantites,
  emitter: {
    company: getInitialCompany(),
  },
  transporter: {
    company: {
      ...getInitialCompany(),
    },
    // TEMP FIELD for the frontend to handle this special case
    isExemptedOfRecepisse: false,
    transport: {
      mode: TransportMode.Road,
      plates: [],
    },
  },
  destination: {
    company: getInitialCompany(),
    cap: "",
    plannedOperationCode: "" as BsffOperationCode,
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
