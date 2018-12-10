export default {
  emitter: {
    type: "PRODUCER",
    pickupSite: "Nom:\nAdresse:\nMail:",
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
    validityLimit: "",
    contact: "",
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
  wasteDetails: {
    code: "",
    onuCode: "",
    packagings: [],
    otherPackaging: "",
    numberOfPackages: "",
    quantity: "",
    quantityType: "ESTIMATED"
  }
};
