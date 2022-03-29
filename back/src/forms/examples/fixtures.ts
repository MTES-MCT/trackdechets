/**
 * Fixtures used as building blocks of mutations inputs
 */

function emitterCompanyInput(siret: string) {
  return {
    siret,
    name: "Déchets & Co",
    address: "1 rue de paradis, 75010 PARIS",
    contact: "Jean Dupont",
    phone: "01 00 00 00 00",
    mail: "jean.dupont@dechets.org"
  };
}

const workSiteInput = {
  address: "5 rue du chantier",
  postalCode: "75010",
  city: "Paris",
  infos: "Site de stockage de boues"
};

function emitterInput(siret: string) {
  return {
    type: "PRODUCER",
    workSite: workSiteInput,
    company: emitterCompanyInput(siret)
  };
}

function transporterCompanyInput(siret: string) {
  return {
    siret,
    name: "Transport & Co",
    address: "1 rue des 6 chemins, 07100 ANNONAY",
    contact: "Claire Dupuis",
    mail: "claire.dupuis@transportco.fr",
    phone: "04 00 00 00 00"
  };
}

function transporter2CompanyInput(siret: string) {
  return {
    siret,
    name: "Fret & Co",
    address: "1 rue de la gare, 07100 ANNONAY",
    contact: "Jean Le Cheminot",
    mail: "jean.lecheminot@fretco.fr",
    phone: "04 00 00 00 00"
  };
}

const receiptInput = {
  receipt: "12379",
  department: "07",
  validityLimit: "2020-06-30",
  numberPlate: "AD-007-TS"
};

function transporterInput(siret: string) {
  return {
    company: transporterCompanyInput(siret),
    ...receiptInput
  };
}

function traiteurCompanyInput(siret: string) {
  return {
    siret,
    name: "Traiteur & Co",
    address: "1 avenue de l'incinérateur 67100 Strasbourg",
    contact: "Thomas Largeron",
    phone: "03 00 00 00 00",
    mail: "thomas.largeron@incinerateur.fr"
  };
}

function ttrCompanyInput(siret: string) {
  return {
    siret,
    name: "Entreposage & Co",
    address: "1 rue du stock 68100 Mulhouse",
    contact: "Antoine Quistock",
    phone: "03 00 00 00 00",
    mail: "antoine.quistock@entreposage.fr"
  };
}

function recipientInput(siret: string) {
  return {
    processingOperation: "D 10",
    cap: "CAP",
    company: traiteurCompanyInput(siret)
  };
}

function recipientIsTempStorageInput(siret: string) {
  return {
    processingOperation: "D 13",
    cap: "CAP",
    company: ttrCompanyInput(siret),
    isTempStorage: true
  };
}

const wasteDetailsInput = {
  code: "06 05 02*",
  onuCode: "Non Soumis",
  name: "Boues",
  packagingInfos: [{ type: "CITERNE", quantity: 1 }],
  quantity: 1,
  quantityType: "ESTIMATED",
  consistence: "LIQUID"
};

function signEmissionFormInput() {
  return {
    quantity: 1,
    onuCode: "non soumis",
    transporterNumberPlate: "AA-123456-BB",
    emittedAt: "2020-04-03T14:48:00",
    emittedBy: "Isabelle Guichard",
    emittedByEcoOrganisme: false
  };
}

function signTransportFormInput() {
  return {
    takenOverAt: "2020-04-03T14:48:00",
    takenOverBy: "Isabelle Guichard"
  };
}

const receivedInfoInput = {
  wasteAcceptationStatus: "ACCEPTED",
  receivedBy: "Antoine Derieux",
  receivedAt: "2020-04-05T11:18:00",
  signedAt: "2020-04-05T12:00:00",
  quantityReceived: 1
};

const processedInfoInput = {
  processingOperationDone: "D 10",
  processingOperationDescription: "Incinération",
  processedBy: "Alfred Dujardin",
  processedAt: "2020-04-15T10:22:00"
};

const tempStoredInfosInput = {
  wasteAcceptationStatus: "ACCEPTED",
  receivedBy: "John Arnold",
  receivedAt: "2020-05-03T09:00:00",
  signedAt: "2020-05-03T09:00:00",
  quantityReceived: 1,
  quantityType: "REAL"
};

function resealedInfosInput(siret: string) {
  return {
    transporter: transporterInput(siret)
  };
}

function nextSegmentInfoInput(siret: string) {
  return {
    transporter: {
      company: transporter2CompanyInput(siret),
      ...receiptInput
    },
    mode: "RAIL"
  };
}

const takeOverInfoInput = {
  takenOverAt: "2020-04-04T09:00:00.000Z",
  takenOverBy: "Transporteur 2"
};

export default {
  emitterCompanyInput,
  emitterInput,
  transporterCompanyInput,
  transporterInput,
  traiteurCompanyInput,
  recipientInput,
  ttrCompanyInput,
  recipientIsTempStorageInput,
  wasteDetailsInput,
  workSiteInput,
  receiptInput,
  signEmissionFormInput,
  signTransportFormInput,
  receivedInfoInput,
  processedInfoInput,
  tempStoredInfosInput,
  resealedInfosInput,
  nextSegmentInfoInput,
  takeOverInfoInput
};
