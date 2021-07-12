import { getInitialCompany } from "form/bsdd/utils/initial-state";

import { WorkSite } from "generated/graphql/types";

export function getInitialEmitterWorkSite(workSite?: WorkSite | null) {
  return {
    name: workSite?.name ?? "",
    address: workSite?.address ?? "",
    city: workSite?.city ?? "",
    postalCode: workSite?.postalCode ?? "",
    infos: workSite?.infos ?? "",
  };
}
const initialState = {
  emitter: {
    company: getInitialCompany(),
    workSite: null,
    customInfo: null,
  },
  emission: {
    wasteCode: "18 01 03*",
    wasteDetails: {
      packagingInfos: [],
      quantity: { value: null, type: null },
      onuCode: null,
    },
    handedOverAt: null,
  },
  transport: {
    wasteDetails: { packagingInfos: [], quantity: { value: null, type: null } },
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
};

const getInitialState = () => initialState;

export default getInitialState;
