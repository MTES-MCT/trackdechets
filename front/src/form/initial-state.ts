export default {
  emitter: {
    type: "PRODUCER",
    pickupSite: "",
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  recipient: {
    cap: "",
    processingOperation: "",
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  transporter: {
    receipt: "",
    department: "",
    validityLimit: null,
    numberPlate: "",
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  trader: {
    receipt: "",
    department: "",
    validityLimit: null,
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  wasteDetails: {
    code: "",
    name: "",
    onuCode: "",
    packagings: [],
    otherPackaging: "",
    numberOfPackages: null,
    quantity: null,
    quantityType: "ESTIMATED",
    consistence: "SOLID"
  }
};
