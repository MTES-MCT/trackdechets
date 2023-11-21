import { getInitialCompany } from "../../bsdd/utils/initial-state";

import { BsdasriWeight, Bsdasri, PickupSite, BsdasriType } from "codegen-ui";

export function getInitialEmitterPickupSiteFn(pickupSite?: PickupSite | null) {
  return {
    name: pickupSite?.name ?? "",
    address: pickupSite?.address ?? "",
    city: pickupSite?.city ?? "",
    postalCode: pickupSite?.postalCode ?? "",
    infos: pickupSite?.infos ?? ""
  };
}

export const getInitialWeightFn = (weight?: BsdasriWeight | null) => ({
  value: weight?.value,
  isEstimate: weight?.isEstimate ?? false
});

const getInitialState = (f?: Bsdasri | null) => ({
  type: BsdasriType.Simple,
  waste: {
    code: "18 01 03*",
    adr: ""
  },
  identification: { numbers: null },
  ecoOrganisme: null,
  emitter: {
    company: getInitialCompany(),
    pickupSite: null,
    customInfo: "",

    emission: {
      packagings: [],

      weight: !!f?.emitter?.emission?.weight
        ? getInitialWeightFn(f?.emitter?.emission?.weight)
        : null
    }
  },
  transporter: {
    company: getInitialCompany(),
    customInfo: "",
    recepisse: {
      isExempted: false
    },
    transport: {
      mode: "ROAD",
      packagings: [],
      weight: !!f?.transporter?.transport?.weight
        ? getInitialWeightFn(f?.transporter?.transport?.weight)
        : null,
      plates: [],
      takenOverAt: null,
      handedOverAt: null,
      acceptation: {
        status: null,
        refusalReason: null,
        refusedWeight: null
      }
    }
  },
  destination: {
    company: getInitialCompany(),
    customInfo: "",
    reception: {
      packagings: [],
      acceptation: null,
      date: null
    },
    operation: {
      code: null,
      date: null,
      weight: null
    }
  },
  grouping: [],
  synthesizing: []
});

export default getInitialState;
