import {
  BsffEmitterInput,
  BsffTransporterInput,
  TransportMode,
  BsffType
} from "@td/codegen-ui";
import { getInitialCompany } from "../../../../common/data/initialState";
import { emptyBsffPackaging } from "../../../../Forms/Components/PackagingList/helpers";

const getInitialEmitterCompany = (emitter?: BsffEmitterInput | null) => {
  return {
    siret: emitter?.company?.siret ?? "",
    name: emitter?.company?.name ?? "",
    address: emitter?.company?.address ?? "",
    city: "",
    contact: emitter?.company?.contact ?? "",
    mail: emitter?.company?.mail ?? "",
    phone: emitter?.company?.phone ?? "",
    vatNumber: emitter?.company?.vatNumber ?? "",
    country: emitter?.company?.country ?? "",
    omiNumber: emitter?.company?.omiNumber ?? ""
  };
};

const initialTransporter: BsffTransporterInput = {
  transport: {
    mode: TransportMode.Road,
    plates: []
  },
  recepisse: { isExempted: false },
  company: getInitialCompany()
};

export default {
  type: BsffType.CollectePetitesQuantites,
  emitter: {
    company: getInitialEmitterCompany()
  },
  waste: {
    code: null,
    description: "",
    adr: ""
  },
  packagings: [emptyBsffPackaging],
  weight: {
    isEstimate: false,
    value: null
  },
  broker: {
    company: getInitialCompany()
  },
  destination: {
    company: getInitialCompany(),
    cap: null,
    plannedOperationCode: null,
    customInfo: null,
    reception: {
      date: null,
      weight: null,
      refusedWeight: null,
      acceptationStatus: null,
      refusalReason: null
    },
    operation: {
      code: null,
      mode: null,
      description: null,
      date: null,
      nextDestination: null
    }
  },
  nextBsff: null,
  transporters: [initialTransporter],
  ficheInterventions: [],
  previousPackagings: [],
  grouping: [],
  forwarding: null,
  repackaging: []
};
