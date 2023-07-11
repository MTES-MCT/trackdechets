import fixtures from "./fixtures";

const {
  detenteurInput,
  nextDestinationInput,
  operateurInput,
  traiteurInput,
  ttrInput
} = fixtures;

function transporterInput(vatNumber: string) {
  return {
    company: {
      siret: null,
      vatNumber,
      name: "Transport & Co",
      address: "1 rue des 6 chemins, 07100 ANNONAY",
      contact: "Claire Dupuis",
      mail: "claire.dupuis@transportco.fr",
      phone: "04 00 00 00 00"
    }
  };
}

export default {
  detenteurInput,
  operateurInput,
  transporterInput,
  ttrInput,
  traiteurInput,
  nextDestinationInput
};
