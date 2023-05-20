import fixtures from "./fixtures";

const {
  emitterCompanyInput,
  emitterInput,
  traiteurCompanyInput,
  recipientInput,
  ttrCompanyInput,
  recipientIsTempStorageInput,
  ttrInput,
  wasteDetailsInput,
  workSiteInput,
  signEmissionFormInput,
  signTransportFormInput,
  receivedInfoInput,
  processedInfoInput,
  awaitingGroupInfoInput,
  tempStoredInfosInput,
  takeOverInfoInput
} = fixtures;

function transporterCompanyInput(vatNumber: string) {
  return {
    siret: null,
    vatNumber,
    name: "Transport & Co",
    address: "1 rue des 6 chemins, 07100 ANNONAY",
    contact: "Claire Dupuis",
    mail: "claire.dupuis@transportco.fr",
    phone: "04 00 00 00 00"
  };
}

function transporter2CompanyInput(vatNumber: string) {
  return {
    siret: null,
    vatNumber,
    name: "Fret & Co",
    address: "1 rue de la gare, 07100 ANNONAY",
    contact: "Jean Le Cheminot",
    mail: "jean.lecheminot@fretco.fr",
    phone: "04 00 00 00 00"
  };
}

function nextSegmentInfoInput(vatNumber: string) {
  return {
    transporter: {
      company: transporter2CompanyInput(vatNumber)
    },
    mode: "RAIL"
  };
}

function transporterInput(vatNumber: string) {
  return {
    company: transporterCompanyInput(vatNumber),
    numberPlate: null
  };
}

function resealedInfosInput(vatNumber: string) {
  return {
    transporter: transporterInput(vatNumber)
  };
}

export default {
  emitterCompanyInput,
  emitterInput,
  transporterCompanyInput,
  transporterInput,
  traiteurCompanyInput,
  recipientInput,
  ttrCompanyInput,
  recipientIsTempStorageInput,
  ttrInput,
  wasteDetailsInput,
  workSiteInput,
  signEmissionFormInput,
  signTransportFormInput,
  receivedInfoInput,
  processedInfoInput,
  awaitingGroupInfoInput,
  tempStoredInfosInput,
  resealedInfosInput,
  nextSegmentInfoInput,
  takeOverInfoInput
};
