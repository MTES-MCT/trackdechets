const emitterCompanyInput = siret => ({
  siret: siret,
  name: "Hopital Saint Denis",
  address: "40 rue du médecin, 93200 Saint Denis",
  mail: "contact@hsd.fr",
  contact: "Docteur Brun",
  phone: "06 06 06 06 06"
});

const emitterInput = siret => ({
  company: emitterCompanyInput(siret),
  type: "PRODUCER"
});

const emissionInput = {
  wasteCode: "18 01 03*",
  wasteDetails: {
    quantity: 1,
    quantityType: "REAL",
    onuCode: "non soumis",
    packagingInfos: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
  }
};

const transporteurCompanyInput = siret => ({
  siret,
  name: "Transport Inc",
  address: "6 rue des 7 chemins, 07100 ANNONAY",
  mail: "contact@transport.co",
  phone: "07 00 00 00 00",
  contact: "John Antoine"
});

const receiptInput = {
  receipt: "KIH-458-87",
  receiptDepartment: "07",
  receiptValidityLimit: "2022-01-01"
};

const transporterInput = siret => ({
  company: transporteurCompanyInput(siret),
  ...receiptInput
});

const transportInput = {
  wasteAcceptation: { status: "ACCEPTED" },
  wasteDetails: {
    quantity: 1,
    quantityType: "REAL",
    packagingInfos: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
  },
  takenOverAt: "2022-04-27"
};

const recipientCompanyInput = siret => ({
  siret,
  name: "Traiteur Inc",
  address: "14 rue des acacias, 68100 Mulhouse",
  mail: "contact@traiteur.co",
  contact: "Bob Lapointe",
  phone: "07 01 00 00 00"
});

const recipientInput = siret => ({
  company: recipientCompanyInput(siret)
});

const receptionInput = {
  wasteAcceptation: { status: "ACCEPTED" },
  wasteDetails: {
    quantity: 1,
    quantityType: "REAL",
    packagingInfos: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
  },
  receivedAt: "2021-04-27"
};

const operationInput = {
  processingOperation: "D10",
  processedAt: "2020-04-28"
};

module.exports = {
  emitterCompanyInput,
  emitterInput,
  emissionInput,
  transporteurCompanyInput,
  transporterInput,
  transportInput,
  recipientCompanyInput,
  recipientInput,
  receptionInput,
  operationInput
};
