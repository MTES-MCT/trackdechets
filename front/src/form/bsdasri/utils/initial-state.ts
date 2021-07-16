import { getInitialCompany } from "form/bsdd/utils/initial-state";

import { WorkSite, BsdasriQuantity, Bsdasri } from "generated/graphql/types";

export function getInitialEmitterWorkSite(workSite?: WorkSite | null) {
  return {
    name: workSite?.name ?? "",
    address: workSite?.address ?? "",
    city: workSite?.city ?? "",
    postalCode: workSite?.postalCode ?? "",
    infos: workSite?.infos ?? "",
  };
}

export const getInitialQuantityFn = (quantity?: BsdasriQuantity | null) => ({
  value: quantity?.value,
  type: quantity?.type,
});

const getInitialState = (f?: Bsdasri | null) => ({
  emitter: {
    company: getInitialCompany(),
    workSite: null,
    customInfo: "",
  },
  emission: {
    wasteCode: "18 01 03*",
    wasteDetails: {
      packagingInfos: [],
      quantity: !!f?.emission?.wasteDetails?.quantity
        ? getInitialQuantityFn(f?.emission?.wasteDetails?.quantity)
        : null,
      onuCode: null,
    },
    handedOverAt: null,
  },
  transport: {
    wasteDetails: {
      packagingInfos: [],
      quantity: !!f?.transport?.wasteDetails?.quantity
        ? getInitialQuantityFn(f?.transport?.wasteDetails?.quantity)
        : null,
    },
    takenOverAt: null,
    handedOverAt: null,
    wasteAcceptation: {
      status: null,
      refusalReason: null,
      refusedQuantity: null,
    },
  },
  recipient: {
    company: getInitialCompany(),
    customInfo: null,
  },
  reception: {
    wasteDetails: {
      packagingInfos: [],
    },
    wasteAcceptation: null,
    receivedAt: null,
  },
  operation: {
    processingOperation: null,
    processedAt: null,
    quantity: { value: null },
  },
  transporter: {
    company: getInitialCompany(),
    customInfo: null,
    receipt: null,
    receiptDepartment: null,
    receiptValidityLimit: null,
  },
  regroupedBsdasris: [],
});

export default getInitialState;
