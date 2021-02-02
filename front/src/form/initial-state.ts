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

export default {
  customId: "",
  emitter: {
    type: "PRODUCER",
    workSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: "",
    },
    company: initialCompany,
  },
  recipient: {
    cap: "",
    processingOperation: "",
    isTempStorage: false,
    company: initialCompany,
  },
  transporter: initialTransporter,
  trader: {
    receipt: "",
    department: "",
    validityLimit: null,
    company: initialCompany,
  },
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
  ecoOrganisme: {
    siret: null,
    name: null,
  },
  temporaryStorageDetail: null,
};
