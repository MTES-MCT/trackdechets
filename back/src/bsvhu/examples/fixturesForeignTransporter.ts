import fixtures from "./fixtures";

const {
  emitterCompanyInput,
  emitterInput,
  wasteDetailsInput,
  broyeurCompanyInput,
  broyeurInput,
  receptionInput,
  operationInput
} = fixtures;

const receiptInput = null;

function transporterCompanyInput(vatNumber: string) {
  return {
    siret: null,
    vatNumber,
    name: "Transport Inc",
    address: "1 rue des 6 chemins, 07100 Annonay",
    contact: "Jean Dupont",
    phone: "01 00 00 00 00",
    mail: "transport.dupont@transporter.fr"
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
  wasteDetailsInput,
  transporterCompanyInput,
  transporterInput,
  receiptInput,
  broyeurCompanyInput,
  broyeurInput,
  receptionInput,
  operationInput
};
