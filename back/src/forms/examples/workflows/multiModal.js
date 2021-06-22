/* eslint @typescript-eslint/no-var-requires: "off" */
const { createFormMultiModal } = require("../steps/createForm");
const { markAsSealed } = require("../steps/markAsSealed");
const {
  markSegmentAsReadyToTakeOver
} = require("../steps/markSegmentAsReadyToTakeOver");
const { prepareSegment } = require("../steps/prepareSegment");
const { takeOverSegment } = require("../steps/takeOverSegment");
const { signedByTransporter } = require("../steps/signedByTransporter");
const { markAsReceived } = require("../steps/markAsReceived");
const { markAsProcessed } = require("../steps/markAsProcessed");

module.exports = {
  title: "Transport multi-modal",
  description: `Lors d'un transport multimodal simple, un bordereau est transmis
sans scission ni regroupement d'un transporteur à un autre, du producteur jusqu'à
un site de traitement. Après le premier transporteur, les tronçons suivants sont
appelés segments. Il peut y avoir autant de segments que nécessaire. Le pdf est
mis à jour au fur et mesure de la prise en charge du déchet sur les différents segments.`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createFormMultiModal("producteur"),
    markAsSealed("producteur"),
    signedByTransporter("transporteur1"),
    prepareSegment("transporteur1"),
    markSegmentAsReadyToTakeOver("transporteur1"),
    takeOverSegment("transporteur2"),
    markAsReceived("traiteur"),
    markAsProcessed("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur1: { siret: "SIRET_TRANSPORTEUR_1" },
    transporteur2: { siret: "SIRET_TRANSPORTEUR_2" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" },
    transportSegment: { id: "ID_TRANSPORT_SEGMENT" }
  }
};
