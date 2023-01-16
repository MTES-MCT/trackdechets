import fixtures from "./fixtures";

const {
  emitterCompanyInput,
  emitterInput,
  receiptInput,
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
  nextSegmentInfoInput,
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

function transporterInput(vatNumber: string) {
  return {
    company: transporterCompanyInput(vatNumber),
    receipt: null,
    department: null,
    validityLimit: null,
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
  receiptInput,
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
