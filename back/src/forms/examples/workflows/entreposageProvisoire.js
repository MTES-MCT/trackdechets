/* eslint @typescript-eslint/no-var-requires: "off" */
const { createFormTempStorage: createForm } = require("../steps/createForm");
const { markAsSealed } = require("../steps/markAsSealed");
const {
  signedByTransporter,
  signedByTransporterAfterTempStorage
} = require("../steps/signedByTransporter");
const { markAsTempStored } = require("../steps/markAsTempStored");
const { markAsResealed } = require("../steps/markAsResealed");
const { markAsReceived } = require("../steps/markAsReceived");
const { markAsProcessed } = require("../steps/markAsProcessed");

module.exports = {
  title: "Entreposage provisoire",
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    { name: "ttr", companyTypes: ["COLLECTOR"] },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createForm("producteur"),
    markAsSealed("producteur"),
    signedByTransporter("transporteur1"),
    markAsTempStored("ttr"),
    markAsResealed("ttr"),
    signedByTransporterAfterTempStorage("transporteur2"),
    markAsReceived("traiteur"),
    markAsProcessed("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    transporteur1: { siret: "SIRET_TRANSPORTEUR_1" },
    ttr: { siret: "SIRET_TTR", securityCode: "XXXX" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    transporteur2: { siret: "SIRET_TRANSPORTEUR_2" },
    bsd: { id: "ID_BSD" }
  }
};
