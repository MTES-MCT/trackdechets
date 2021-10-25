import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { addYears, startOfYear } from "date-fns";

import { BsdasriWeight, Bsdasri, PickupSite } from "generated/graphql/types";

export function getInitialEmitterPickupSiteFn(pickupSite?: PickupSite | null) {
  return {
    name: pickupSite?.name ?? "",
    address: pickupSite?.address ?? "",
    city: pickupSite?.city ?? "",
    postalCode: pickupSite?.postalCode ?? "",
    infos: pickupSite?.infos ?? "",
  };
}

export const getInitialWeightFn = (weight?: BsdasriWeight | null) => ({
  value: weight?.value,
  isEstimate: weight?.isEstimate ?? false,
});

const getInitialState = (f?: Bsdasri | null) => ({
  waste: {
    code: "18 01 03*",
    adr: "",
  },
  ecoOrganisme: null,
  emitter: {
    company: getInitialCompany(),
    pickupSite: null,
    customInfo: "",

    emission: {
      packagings: [],

      weight: !!f?.emitter?.emission?.weight
        ? getInitialWeightFn(f?.emitter?.emission?.weight)
        : null,
    },
  },
  transporter: {
    company: getInitialCompany(),
    customInfo: "",
    recepisse: {
      number: "",
      department: "",
      validityLimit: startOfYear(addYears(new Date(), 1)).toISOString(),
    },
    transport: {
      mode: "ROAD",
      packagings: [],
      weight: !!f?.transporter?.transport?.weight
        ? getInitialWeightFn(f?.transporter?.transport?.weight)
        : null,
      plates: null,
      takenOverAt: null,
      handedOverAt: null,
      acceptation: {
        status: null,
        refusalReason: null,
        refusedWeight: null,
      },
    },
  },
  destination: {
    company: getInitialCompany(),
    customInfo: "",
    reception: {
      packagings: [],
      acceptation: null,
      date: null,
    },
    operation: {
      code: null,
      date: null,
      weight: null,
    },
  },
  grouping: [],
});

export default getInitialState;
