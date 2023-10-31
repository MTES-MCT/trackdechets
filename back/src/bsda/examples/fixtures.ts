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

function privateIndividualEmitterInput() {
  return {
    isPrivateIndividual: true,
    company: {
      name: "Henri Dupont",
      address: "5 rue du producteur",
      phone: "01 00 00 00 00",
      mail: "henri.dupont@dechets.org"
    },
    pickupSite: pickupSiteInput
  };
}

function packagingsInput() {
  return [
    {
      type: "BIG_BAG",
      quantity: 2
    }
  ];
}

function wasteInput() {
  return {
    code: "16 01 11*",
    consistence: "SOLIDE",
    familyCode: "Code famille",
    materialName: "Nom usuel du matériau",
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

function transporterInput(siret: string) {
  return {
    company: transporterCompanyInput(siret)
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

function emitterSignatureUpdateInput() {
  return {};
}

function workerSignatureUpdateInput() {
  return {};
}

function transporterSignatureUpdateInput() {
  return {
    transporter: {
      transport: {
        mode: "ROAD",
        plates: ["abc21cde"],
        takenOverAt: new Date().toISOString() as any
      }
    }
  };
}

function destinationSignatureUpdateInput() {
  return {
    destination: {
      reception: {
        acceptationStatus: "ACCEPTED",
        date: new Date().toISOString() as any,
        weight: 2.1
      },
      operation: {
        code: "D 5",
        mode: "ELIMINATION",
        date: new Date().toISOString() as any
      }
    }
  };
}

function transporterToGroupInput(siret: string) {
  return {
    company: transporterCompanyInput(siret),
    transport: {
      mode: "ROAD",
      plates: ["abc21cde"],
      takenOverAt: new Date().toISOString() as any
    }
  };
}

function destinationToGroupInput(siret: string) {
  return {
    company: traiteurCompanyInput(siret),
    plannedOperationCode: "D 15",
    cap: "CAP",
    reception: {
      acceptationStatus: "ACCEPTED",
      date: new Date().toISOString() as any,
      weight: 2.1
    },
    operation: {
      code: "D 15",
      date: new Date().toISOString() as any
    }
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
