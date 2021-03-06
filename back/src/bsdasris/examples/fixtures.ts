function emitterCompanyInput(siret: string) {
  return {
    siret,
    name: "Hopital Saint Denis",
    address: "40 rue du médecin, 93200 Saint Denis",
    mail: "contact@hsd.fr",
    contact: "Docteur Brun",
    phone: "06 06 06 06 06"
  };
}

function emitterInput(siret: string) {
  return {
    company: emitterCompanyInput(siret),
    type: "PRODUCER"
  };
}

const emissionInput = {
  wasteCode: "18 01 03*",
  wasteDetails: {
    quantity: {
      value: 1,
      type: "REAL"
    },
    onuCode: "non soumis",
    packagingInfos: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
  }
};

function transporteurCompanyInput(siret: string) {
  return {
    siret,
    name: "Transport Inc",
    address: "6 rue des 7 chemins, 07100 ANNONAY",
    mail: "contact@transport.co",
    phone: "07 00 00 00 00",
    contact: "John Antoine"
  };
}

const receiptInput = {
  receipt: "KIH-458-87",
  receiptDepartment: "07",
  receiptValidityLimit: "2022-01-01"
};

function transporterInput(siret: string) {
  return {
    company: transporteurCompanyInput(siret),
    ...receiptInput
  };
}

const transportInput = {
  wasteAcceptation: { status: "ACCEPTED" },
  wasteDetails: {
    quantity: {
      value: 1,
      type: "REAL"
    },
    packagingInfos: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
  },
  takenOverAt: "2022-04-27"
};

function recipientCompanyInput(siret: string) {
  return {
    siret,
    name: "Traiteur Inc",
    address: "14 rue des acacias, 68100 Mulhouse",
    mail: "contact@traiteur.co",
    contact: "Bob Lapointe",
    phone: "07 01 00 00 00"
  };
}

function recipientInput(siret: string) {
  return {
    company: recipientCompanyInput(siret)
  };
}

const receptionInput = {
  wasteAcceptation: { status: "ACCEPTED" },
  wasteDetails: {
    volume: 1,
    packagingInfos: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
  },
  receivedAt: "2021-04-27"
};

const operationInput = {
  quantity: {
    value: 1,
    type: "REAL"
  },
  processingOperation: "D10",
  processedAt: "2020-04-28"
};

export default {
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
