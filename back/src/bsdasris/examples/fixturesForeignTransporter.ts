import {
  wasteInput,
  emitterCompanyInput,
  emitterInput,
  emissionInput,
  ecoorganismeInput,
  transportInput,
  synthesisTransportInput,
  destinationCompanyInput,
  destinationInput,
  receptionInput,
  operationInput,
  operationForGroupingInput
} from "./fixtures";

export function transporteurCompanyInput(vatNumber: string) {
  return {
    siret: null,
    vatNumber,
    name: "Transport Inc",
    address: "6 rue des 7 chemins, 07100 ANNONAY",
    mail: "contact@transport.co",
    phone: "07 00 00 00 00",
    contact: "John Antoine"
  };
}

export function transporterInput(vatNumber: string) {
  return {
    company: transporteurCompanyInput(vatNumber),
    recepisse: null
  };
}

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
