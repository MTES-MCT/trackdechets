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
      phone: 0
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
      phone: 0
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
      phone: 0
    }
  },
  wasteDetails: {
    code: "",
    onuCode: "",
    packaging: "",
    numberOfPackages: 1,
    quantity: 0.0,
    quantityType: "ESTIMATED"
  }
};
