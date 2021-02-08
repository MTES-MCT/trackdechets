const initialCompany = {
  siret: "",
  name: "",
  address: "",
  contact: "",
  mail: "",
  phone: "",
};

const initialTransporter = {
  isExemptedOfReceipt: false,
  receipt: "",
  department: "",
  validityLimit: null,
  numberPlate: "",
  company: initialCompany,
};

export const initalTemporaryStorageDetail = {
  destination: {
    company: initialCompany,
    cap: "",
    processingOperation: "",
  },
};

export const initialTrader = {
  receipt: "",
  department: "",
  validityLimit: null,
  company: initialCompany,
};

export const initialEcoOrganisme = {
  siret: null,
  name: null,
};

export const initialWorkSite = {
  name: "",
  address: "",
  city: "",
  postalCode: "",
  infos: "",
};

export default {
  customId: "",
  emitter: {
    type: "PRODUCER",
    workSite: null,
    company: initialCompany,
  },
  recipient: {
    cap: "",
    processingOperation: "",
    isTempStorage: false,
    company: initialCompany,
  },
  transporter: initialTransporter,
  trader: null,
  wasteDetails: {
    code: "",
    name: "",
    onuCode: "",
    packagingInfos: [],
    quantity: null,
    quantityType: "ESTIMATED",
    consistence: "SOLID",
    pop: false,
  },
  appendix2Forms: [],
  ecoOrganisme: null,
  temporaryStorageDetail: null,
};
