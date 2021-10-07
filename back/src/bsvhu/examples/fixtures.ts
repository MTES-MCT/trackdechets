function emitterCompanyInput(siret: string) {
  return {
    siret,
    name: "Casse auto",
    address: "1 rue de paradis, 75010 PARIS",
    contact: "Jean Voiture",
    phone: "01 00 00 00 00",
    mail: "jean.voiture@vhu.fr"
  };
}

function emitterInput(siret: string) {
  return {
    agrementNumber: "1234",
    company: emitterCompanyInput(siret)
  };
}

const wasteDetailsInput = {
  wasteCode: "16 01 06",
  packaging: "UNITE",
  identification: {
    numbers: ["123", "456"],
    type: "NUMERO_ORDRE_REGISTRE_POLICE"
  },
  quantity: 2,
  weight: {
    value: 1.3,
    isEstimate: false
  }
};

function transporterCompanyInput(siret: string) {
  return {
    siret,
    name: "Transport Inc",
    address: "1 rue des 6 chemins, 07100 Annonay",
    contact: "Jean Dupont",
    phone: "01 00 00 00 00",
    mail: "transport.dupont@transporter.fr"
  };
}

const receiptInput = {
  number: "recepisse number",
  department: "75",
  validityLimit: "2020-06-30"
};

function transporterInput(siret: string) {
  return {
    company: transporterCompanyInput(siret)
  };
}

function broyeurCompanyInput(siret: string) {
  return {
    siret,
    name: "Broyeur du Sud Est",
    address: "4 boulevard Longchamp, 13001 Marseille",
    contact: "Tom Broyeur",
    phone: "01 00 00 00 00",
    mail: "tom@broyeur.fr"
  };
}

function broyeurInput(siret: string) {
  return {
    type: "BROYEUR",
    agrementNumber: "456",
    plannedOperationCode: "R 12",
    company: broyeurCompanyInput(siret)
  };
}

const receptionInput = {
  weight: 1.4,
  acceptationStatus: "ACCEPTED"
};

const operationInput = {
  date: "2021-04-27",
  code: "R 12"
};

export default {
  emitterCompanyInput,
  emitterInput,
  wasteDetailsInput,
  transporterCompanyInput,
  transporterInput,
  receiptInput,
  broyeurCompanyInput,
  broyeurInput,
  receptionInput,
  operationInput
};
