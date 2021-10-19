const wasteInput = {
  waste: {
    code: "18 01 03*",

    adr: "non soumis"
  }
};
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
    company: emitterCompanyInput(siret)
  };
}

const emissionInput = {
  weight: {
    value: 1,
    isEstimate: false
  },
  packagings: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
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

const recepisseInput = {
  number: "KIH-458-87",
  department: "07",
  validityLimit: "2022-01-01"
};

function transporterInput(siret: string) {
  return {
    company: transporteurCompanyInput(siret),
    recepisse: recepisseInput
  };
}

const transportInput = {
  acceptation: { status: "ACCEPTED" },

  weight: {
    value: 1,
    isEstimate: false
  },
  packagings: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }],

  takenOverAt: "2022-04-27"
};

function destinationCompanyInput(siret: string) {
  return {
    siret,
    name: "Traiteur Inc",
    address: "14 rue des acacias, 68100 Mulhouse",
    mail: "contact@traiteur.co",
    contact: "Bob Lapointe",
    phone: "07 01 00 00 00"
  };
}

function destinationInput(siret: string) {
  return {
    company: destinationCompanyInput(siret)
  };
}

const receptionInput = {
  acceptation: { status: "ACCEPTED" },

  volume: 1,
  packagings: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }],

  date: "2021-04-27"
};

const operationInput = {
  weight: {
    value: 1
  },
  code: "D10",
  date: "2020-04-28"
};

export default {
  wasteInput,
  emitterCompanyInput,
  emitterInput,
  emissionInput,
  transporteurCompanyInput,
  transporterInput,
  transportInput,
  destinationCompanyInput,
  destinationInput,
  receptionInput,
  operationInput
};
