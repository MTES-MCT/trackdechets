import fixtures from "./fixtures";
const {
  emitterCompanyInput,
  emitterInput,
  privateIndividualEmitterInput,
  transporterToGroupInput,
  traiteurCompanyInput,
  destinationInput,
  destinationToGroupInput,
  packagingsInput,
  wasteInput,
  weightInput,
  workerInput,
  pickupSiteInput,
  emitterSignatureUpdateInput,
  workerSignatureUpdateInput,
  transporterSignatureUpdateInput,
  destinationSignatureUpdateInput
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
    company: transporterCompanyInput(vatNumber)
  };
}

export default {
  emitterCompanyInput,
  emitterInput,
  privateIndividualEmitterInput,
  transporterCompanyInput,
  transporterInput,
  transporterToGroupInput,
  traiteurCompanyInput,
  destinationInput,
  destinationToGroupInput,
  packagingsInput,
  wasteInput,
  weightInput,
  workerInput,
  pickupSiteInput,
  emitterSignatureUpdateInput,
  workerSignatureUpdateInput,
  transporterSignatureUpdateInput,
  destinationSignatureUpdateInput
};
