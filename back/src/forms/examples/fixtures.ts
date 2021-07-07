/**
 * Fixtures used as building blocks of mutations inputs
 */

import { WorkSite } from "../../generated/graphql/types";

const emitterCompanyInput = siret => ({
  siret,
  name: "Déchets & Co",
  address: "1 rue de paradis, 75010 PARIS",
  contact: "Jean Dupont",
  phone: "01 00 00 00 00",
  mail: "jean.dupont@dechets.org"
});

const workSiteInput: WorkSite = {
  address: "5 rue du chantier",
  postalCode: "75010",
  city: "Paris",
  infos: "Site de stockage de boues"
};

const emitterInput = siret => ({
  type: "PRODUCER",
  workSite: workSiteInput,
  company: emitterCompanyInput(siret)
});

const transporterCompanyInput = siret => ({
  siret,
  name: "Transport & Co",
  address: "1 rue des 6 chemins, 07100 ANNONAY",
  contact: "Claire Dupuis",
  mail: "claire.dupuis@transportco.fr",
  phone: "04 00 00 00 00"
});

const transporter2CompanyInput = siret => ({
  siret,
  name: "Fret & Co",
  address: "1 rue de la gare, 07100 ANNONAY",
  contact: "Jean Le Cheminot",
  mail: "jean.lecheminot@fretco.fr",
  phone: "04 00 00 00 00"
});

const receiptInput = {
  receipt: "12379",
  department: "07",
  validityLimit: "2020-06-30",
  numberPlate: "AD-007-TS"
};

const transporterInput = siret => ({
  company: transporterCompanyInput(siret),
  ...receiptInput
});

const traiteurCompanyInput = siret => ({
  siret,
  name: "Traiteur & Co",
  address: "1 avenue de l'incinérateur 67100 Strasbourg",
  contact: "Thomas Largeron",
  phone: "03 00 00 00 00",
  mail: "thomas.largeron@incinerateur.fr"
});

const ttrCompanyInput = siret => ({
  siret,
  name: "Entreposage & Co",
  address: "1 rue du stock 68100 Mulhouse",
  contact: "Antoine Quistock",
  phone: "03 00 00 00 00",
  mail: "antoine.quistock@entreposage.fr"
});

const recipientInput = siret => ({
  processingOperation: "D 10",
  cap: "CAP",
  company: traiteurCompanyInput(siret)
});

const recipientIsTempStorageInput = siret => ({
  processingOperation: "D 13",
  cap: "CAP",
  company: ttrCompanyInput(siret),
  isTempStorage: true
});

const wasteDetailsInput = {
  code: "06 05 02*",
  onuCode: "Non Soumis",
  name: "Boues",
  packagingInfos: [{ type: "CITERNE", quantity: 1 }],
  quantity: 1,
  quantityType: "ESTIMATED",
  consistence: "LIQUID"
};

const signingInfoInput = securityCode => ({
  sentAt: "2020-04-03T14:48:00",
  sentBy: "Isabelle Guichard",
  onuCode: "non soumis",
  quantity: 1,
  signedByTransporter: true,
  signedByProducer: true,
  securityCode
});

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

const resealedInfosInput = siret => ({
  transporter: transporterInput(siret)
});

const nextSegmentInfoInput = siret => ({
  transporter: {
    company: transporter2CompanyInput(siret),
    ...receiptInput
  },
  mode: "RAIL"
});

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
  signingInfoInput,
  receivedInfoInput,
  processedInfoInput,
  tempStoredInfosInput,
  resealedInfosInput,
  nextSegmentInfoInput,
  takeOverInfoInput
};
