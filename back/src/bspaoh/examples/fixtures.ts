const wasteInput = {
  waste: {
    type: "PAOH",
    code: "18 01 02",
    adr: "code adr",
    packagings: [
      {
        type: "BIG_BOX",
        volume: 11,
        quantity: 1,
        containerNumber: "x-1",
        consistence: "SOLIDE",
        identificationCodes: ["ba-1, ba-2"]
      },
      {
        type: "LITTLE_BOX",
        volume: 11,
        quantity: 1,
        containerNumber: "x-2",
        consistence: "LIQUIDE",
        identificationCodes: ["ca-1"]
      }
    ]
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
  detail: {
    weight: {
      value: 1,
      isEstimate: false
    }
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

function transporterInput(siret: string) {
  return {
    company: transporteurCompanyInput(siret)
  };
}

const transportInput = {
  weight: {
    value: 1,
    isEstimate: false
  },

  plates: ["XX-000-XX"]
};

const transportUpdateInput = {
  mode: "ROAD",
  plates: ["XX-000-XX"],
  takenOverAt: "2020-12-03T15:43:00"
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
    company: destinationCompanyInput(siret),
    cap: "numerodecap"
  };
}

const handedOverToDestinationInput = {
  handedOverToDestination: { date: "2022-12-03T15:44:00" }
};

const receptionInput = {
  date: "2020-12-03T15:44:00",
  detail: {
    weight: { value: 22, isEstimate: false }
  },
  acceptation: {
    status: "ACCEPTED",
    packagings: [
      { acceptation: "ACCEPTED", id: "packaging_0" },
      { acceptation: "ACCEPTED", id: "packaging_1" }
    ]
  }
};

const operationInput = {
  code: "R 1",
  date: "2022-12-03T15:44:00"
};

export default {
  wasteInput,
  emitterCompanyInput,
  emitterInput,
  emissionInput,

  transporteurCompanyInput,
  transporterInput,
  transportInput,
  transportUpdateInput,

  handedOverToDestinationInput,
  destinationCompanyInput,
  destinationInput,
  receptionInput,
  operationInput
};
