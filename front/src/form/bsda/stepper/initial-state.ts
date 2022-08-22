import { getInitialCompany } from "form/bsdd/utils/initial-state";
import {
  BsdaConsistence,
  BsdaType,
  TransportMode,
} from "generated/graphql/types";
import { getInitialEmitterPickupSite } from "./steps/Emitter";

const initialState = {
  type: BsdaType.OtherCollections,
  emitter: {
    company: getInitialCompany(),
    isPrivateIndividual: false,
    pickupSite: getInitialEmitterPickupSite(),
  },
  waste: {
    code: "",
    familyCode: "",
    materialName: "",
    consistence: BsdaConsistence.Solide,
    sealNumbers: [],
    adr: "",
    pop: false,
  },
  packagings: [],
  weight: {
    isEstimate: false,
    value: null,
  },
  worker: {
    isDisabled: false,
    company: getInitialCompany(),
    work: {
      hasEmitterPaperSignature: false,
    },
  },
  broker: null,
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
    transport: {
      takenOverAt: null,
      plates: [],
      mode: TransportMode.Road,
    },
  },
  destination: {
    cap: "",
    plannedOperationCode: "",
    company: getInitialCompany(),
    operation: {
      description: "",
      nextDestination: null,
    },
  },
  grouping: [],
  forwarding: null,
};

export default initialState;
