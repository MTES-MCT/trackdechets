import { Workflow } from "../../../common/workflow";

/* eslint @typescript-eslint/no-var-requires: "off" */
const { createForm } = require("../steps/createForm");
const { markAsSealed } = require("../steps/markAsSealed");
const { signedByTransporter } = require("../steps/signedByTransporter");
const { markAsReceived } = require("../steps/markAsReceived");
const { markAsProcessed } = require("../steps/markAsProcessed");

type Context = {
  producteur: { siret: string; securityCode: number };
  transporteur: { siret: string };
  traiteur: { siret: string };
  bsd: { id: string };
};

const workflow: Workflow<Context> = {
  title: "Acheminement direct du producteur à l'installation de traitement",
  description: `Les informations du BSDD sont remplies par le producteur du déchet.
La signature de l'envoi se déroule sur le terminal du transporteur grâce au
code de sécurité de l'émetteur puis le déchet est accepté et traité à l'installation de destination`,
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
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: 1234 },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createForm| A
A(DRAFT) -->|markAsSealed| B(SEALED)
B -->|signedByTransporter| C(SENT)
C --> |markAsReceived| D(ACCEPTED)
D --> |markAsProcessed| E(PROCESSED)`
};

export default workflow;
