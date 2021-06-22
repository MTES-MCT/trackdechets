/* eslint @typescript-eslint/no-var-requires: "off" */
const { createForm } = require("../steps/createForm");
const { markAsSealed } = require("../steps/markAsSealed");
const { importPaperForm } = require("../steps/importPaperForm");

module.exports = {
  title: `Acheminement direct du producteur à l'installation de traitement.
Le bordereau est préparé initialement dans Trackdéchets puis imprimé
au moment de l'enlèvement par le transporteur. Le BSD papier accompagne
le déchet jusqu'au traitement final puis les données sont ré-importés
dans Trackdéchets pour assurer la traçabilité numérique`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createForm("producteur"),
    markAsSealed("producteur"),
    importPaperForm("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  }
};
