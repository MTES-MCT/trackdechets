/* eslint @typescript-eslint/no-var-requires: "off" */

const { createBsvhu } = require("../steps/createBsvhu");
const { signForProducer } = require("../steps/signForProducer");
const { signOperation } = require("../steps/signOperation");
const { signTransport } = require("../steps/signTransport");
const { updateDestination } = require("../steps/updateDestination");
const { updateTransporter } = require("../steps/updateTransporter");

module.exports = {
  title: `Acheminement d'un centre VHU vers un broyeur`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "broyeur", companyTypes: ["WASTE_VEHICLES", "WASTEPROCESSOR"] }
  ],
  steps: [
    createBsvhu("producteur"),
    signForProducer("producteur"),
    updateTransporter("transporteur"),
    signTransport("transporteur"),
    updateDestination("broyeur"),
    signOperation("broyeur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    broyeur: { siret: "SIRET_BROYEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createBsvhu| A(INITIAL)
A -->|"signBsvhu (EMISSION)"| B(SIGNED_BY_PRODUCTER)
B -->|updateBsvhu| B
B -->|"signBsvhu (TRANSPORT)"| C(SENT)
C -->|updateBsvhu| C
C -->|"signBsvhu (OPERATION)"| D(PROCESSED)`
};
