import { getInitialCompany } from "../bsdd/utils/initial-state";
import { TransportMode, BspaohType } from "@td/codegen-ui";

export function getInitialEmitterPickupSite(pickupSite) {
  return {
    name: pickupSite?.name ?? "",
    address: pickupSite?.address ?? "",
    city: pickupSite?.city ?? "",
    postalCode: pickupSite?.postalCode ?? "",
    infos: pickupSite?.infos ?? ""
  };
}
export const emptyPackaging = {
  quantity: 1,
  type: null,
  volume: null,

  containerNumber: "",
  consistence: null,
  identificationCodes: []
};
const initialState = {
  waste: {
    adr: null,
    code: "18 01 02",
    packagings: [{ ...emptyPackaging }],
    type: BspaohType.Paoh
  },

  emitter: {
    company: {
      ...getInitialCompany()
    },
    customInfo: null,
    emission: {
      detail: { quantity: 0, weight: { value: null, isEstimate: null } }
    }
    // pickupSite: getInitialEmitterPickupSite()
  },

  transporter: {
    company: {
      ...getInitialCompany()
    },
    customInfo: null,
    recepisse: {
      isExempted: false
    },
    transport: {
      mode: TransportMode.Road,
      plates: [],

      takenOverAt: null
    }
  },
  destination: {
    cap: null,
    company: {
      ...getInitialCompany()
    },

    customInfo: null,
    handedOverToDestination: null,
    operation: null,
    reception: null
  }
};

export default initialState;
