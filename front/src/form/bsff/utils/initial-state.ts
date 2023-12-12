import { getInitialCompany } from "../../bsdd/utils/initial-state";
import {
  BsffInput,
  BsffOperationCode,
  BsffPackagingInput,
  BsffTransporterInput,
  BsffType,
  TransportMode
} from "codegen-ui";

export interface BsffFormInput extends BsffInput {
  transporter: BsffTransporterInput;
  previousPackagings: BsffPackagingInput[];
}

// BsffInput with specific form values
const initialState: BsffFormInput = {
  type: BsffType.CollectePetitesQuantites,
  emitter: {
    company: getInitialCompany()
  },
  transporter: {
    company: {
      ...getInitialCompany()
    },
    recepisse: {
      isExempted: false
    },
    transport: {
      mode: TransportMode.Road,
      plates: []
    }
  },
  destination: {
    company: getInitialCompany(),
    cap: "",
    plannedOperationCode: "" as BsffOperationCode
  },
  packagings: [],
  waste: {
    code: "14 06 01*",
    description: "",
    adr: ""
  },
  weight: {
    value: 0,
    isEstimate: true
  },
  ficheInterventions: [],
  previousPackagings: []
};

export default initialState;
