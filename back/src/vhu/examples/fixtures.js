const emitterCompanyInput = siret => ({
  siret,
  name: "Casse auto",
  address: "1 rue de paradis, 75010 PARIS",
  contact: "Jean Voiture",
  phone: "01 00 00 00 00",
  mail: "jean.voiture@vhu.fr"
});

const emitterInput = siret => ({
  agrementNumber: "1234",
  company: emitterCompanyInput(siret)
});

const wasteDetailsInput = {
  wasteCode: "16 01 06",
  packaging: "UNITE",
  identification: {
    numbers: ["123", "456"],
    type: "NUMERO_ORDRE_REGISTRE_POLICE"
  },
  quantity: {
    number: 2,
    tons: 1.3
  }
};

const transporterCompanyInput = siret => ({
  siret,
  name: "Transport Inc",
  address: "1 rue des 6 chemins, 07100 Annonay",
  contact: "Jean Dupont",
  phone: "01 00 00 00 00",
  mail: "transport.dupont@transporter.fr"
});

const receiptInput = {
  number: "recepisse number",
  department: "75",
  validityLimit: "2020-06-30"
};

const transporterInput = siret => ({
  company: transporterCompanyInput(siret)
});

const broyeurCompanyInput = siret => ({
  siret,
  name: "Broyeur du Sud Est",
  address: "4 boulevard Longchamp, 13001 Marseille",
  contact: "Tom Broyeur",
  phone: "01 00 00 00 00",
  mail: "tom@broyeur.fr"
});

const broyeurInput = siret => ({
  type: "BROYEUR",
  agrementNumber: "456",
  plannedOperationCode: "R 12",
  company: broyeurCompanyInput(siret)
});

const receptionInput = {
  quantity: {
    tons: 1.4
  },
  acceptationStatus: "ACCEPTED"
};

const operationInput = {
  date: "2021-04-27",
  code: "R 12"
};

module.exports = {
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
