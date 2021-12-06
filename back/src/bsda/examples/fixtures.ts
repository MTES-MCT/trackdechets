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

const pickupSiteInput = {
  address: "5 rue du chantier",
  postalCode: "75010",
  city: "Paris",
  infos: "Site de stockage de boues"
};

function emitterInput(siret: string) {
  return {
    isPrivateIndividual: false,
    company: emitterCompanyInput(siret),
    pickupSite: pickupSiteInput
  };
}

function packagingsInput() {
  return [
    {
      type: "BIG_BAG",
      quantity: 2.1
    }
  ];
}

function wasteInput() {
  return {
    code: "Un code",
    consistence: "SOLIDE",
    familyCode: "Code famille",
    materialName: "Nom du matériau",
    name: "Nom",
    sealNumbers: ["1", "2", "3"],
    adr: "ADR"
  };
}

function weightInput() {
  return {
    isEstimate: true,
    value: 2.3
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

const recepisseInput = {
  number: "12379",
  department: "07",
  validityLimit: "2020-06-30"
};

function transporterInput(siret: string) {
  return {
    company: transporterCompanyInput(siret),
    recepisse: recepisseInput
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

function destinationInput(siret: string) {
  return {
    company: traiteurCompanyInput(siret),
    plannedOperationCode: "D 5",
    cap: "CAP"
  };
}

function workerInput(siret: string) {
  return {
    company: workerCompanyInput(siret)
  };
}

function workerCompanyInput(siret: string) {
  return {
    siret,
    name: "Entreprise de travaux & Co",
    address: "1 avenue du travail 67100 Strasbourg",
    contact: "Thomas Lebosseur",
    phone: "03 00 00 00 00",
    mail: "thomas.lebosseur@worker.fr"
  };
}

export default {
  emitterCompanyInput,
  emitterInput,
  transporterCompanyInput,
  transporterInput,
  traiteurCompanyInput,
  destinationInput,
  packagingsInput,
  wasteInput,
  weightInput,
  workerInput,
  pickupSiteInput
};
