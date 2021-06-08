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
      quantity: null,
      quantityType: null,
      onuCode: null,
    },
    handedOverAt: null,
  },
  recipient: {
    company: getInitialCompany(),
    customInfo: null,
  },
  reception: {
    wasteDetails: {
      packagingInfos: [],
      quantity: null,
      quantityType: null,
    },
    wasteAcceptation: null,
    receivedAt: null,
  },
  operation: { processingOperation: null, processedAt: null },
  transporter: {
    company: getInitialCompany(),
    customInfo: null,
  },
  transport: {
    wasteDetails: { packagingInfos: [] },
    takenOverAt: null,
    handedOverAt: null,
  },
};

const getInitialState = () => initialState;

export default getInitialState;
