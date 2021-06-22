/* eslint @typescript-eslint/no-var-requires: "off" */
const { createForm } = require("../steps/createForm");
const { markAsSealed } = require("../steps/markAsSealed");
const { signedByTransporter } = require("../steps/signedByTransporter");
const { markAsReceived } = require("../steps/markAsReceived");
const { markAsProcessed } = require("../steps/markAsProcessed");

module.exports = {
  title: "Acheminement direct du producteur à l'installation de traitement",
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createForm("producteur"),
    markAsSealed("producteur"),
    signedByTransporter("transporteur"),
    markAsReceived("traiteur"),
    markAsProcessed("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  }
};
