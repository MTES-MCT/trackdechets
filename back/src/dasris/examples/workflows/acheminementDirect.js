/* eslint @typescript-eslint/no-var-requires: "off" */
const { createBsdasri } = require("../steps/createBsdasri");
const { signForProducer } = require("../steps/signForProducer");
const { signOperation } = require("../steps/signOperation");
const { signReception } = require("../steps/signReception");
const { signTransport } = require("../steps/signTransport");
const { updateReception } = require("../steps/updateReception");
const { updateOperation } = require("../steps/updateOperation");
const { updateTransport } = require("../steps/updateTransport");

module.exports = {
  title: `Acheminement direct de la personne responsable de l'élimination
 des déchets PRED vers l'installation destinataire`,
  companies: [
    { name: "pred", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createBsdasri("pred"),
    signForProducer("pred"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteur"),
    signReception("traiteur"),
    updateOperation("traiteur"),
    signOperation("traiteur")
  ],
  docContext: {
    pred: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createBsdasri| A(INITIAL)
A -->|"signBsdasri (EMISSION)"| B(SIGNED_BY_PRODUCER)
B -->|updateBsdasri| B
B -->|"signBsdasri (TRANSPORT)"| C(SENT)
C -->|updateBsdasri| C
C -->|"signBsdasri (RECEPTION)"| D(RECEIVED)
D -->|updateBsdasri| D
D -->|"signBsdasri (OPERATION)"| PROCESSED`
};
