export const wasteInput = {
  waste: {
    code: "18 01 03*",
    adr: "non soumis"
  }
};
export function emitterCompanyInput(siret: string) {
  return {
    siret,
    name: "Hopital Saint Denis",
    address: "40 rue du médecin, 93200 Saint Denis",
    mail: "contact@hsd.fr",
    contact: "Docteur Brun",
    phone: "06 06 06 06 06"
  };
}

export function emitterInput(siret: string) {
  return {
    company: emitterCompanyInput(siret)
  };
}

export const emissionInput = {
  weight: {
    value: 1,
    isEstimate: false
  },
  packagings: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }]
};
export function ecoorganismeInput(siret: string) {
  return {
    siret,
    name: "Eco-organisme"
  };
}

export function transporteurCompanyInput(siret: string) {
  return {
    siret,
    name: "Transport Inc",
    address: "6 rue des 7 chemins, 07100 ANNONAY",
    mail: "contact@transport.co",
    phone: "07 00 00 00 00",
    contact: "John Antoine"
  };
}

export const recepisseInput = {
  number: "KIH-458-87",
  department: "07",
  validityLimit: "2022-01-01"
};

export function transporterInput(siret: string) {
  return {
    company: transporteurCompanyInput(siret),
    recepisse: recepisseInput
  };
}

export const transportInput = {
  acceptation: { status: "ACCEPTED" },

  weight: {
    value: 1,
    isEstimate: false
  },
  packagings: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }],

  takenOverAt: "2022-04-27"
};

export const synthesisTransportInput = {
  acceptation: { status: "ACCEPTED" },

  weight: {
    value: 1,
    isEstimate: false
  },

  takenOverAt: "2022-04-27"
};
export function destinationCompanyInput(siret: string) {
  return {
    siret,
    name: "Traiteur Inc",
    address: "14 rue des acacias, 68100 Mulhouse",
    mail: "contact@traiteur.co",
    contact: "Bob Lapointe",
    phone: "07 01 00 00 00"
  };
}

export function destinationInput(siret: string) {
  return {
    company: destinationCompanyInput(siret)
  };
}

export const receptionInput = {
  acceptation: { status: "ACCEPTED" },

  volume: 1,
  packagings: [{ type: "BOITE_CARTON", quantity: 1, volume: 1 }],

  date: "2021-04-27"
};

export const operationInput = {
  weight: {
    value: 1
  },
  code: "D10",
  date: "2020-04-28"
};

export const operationForGroupingInput = {
  weight: {
    value: 1
  },
  code: "D12",
  date: "2020-04-28"
};

export default {
  wasteInput,
  emitterCompanyInput,
  emitterInput,
  emissionInput,
  ecoorganismeInput,
  transporteurCompanyInput,
  transporterInput,
  transportInput,
  synthesisTransportInput,
  destinationCompanyInput,
  destinationInput,
  receptionInput,
  operationInput,
  operationForGroupingInput
};
