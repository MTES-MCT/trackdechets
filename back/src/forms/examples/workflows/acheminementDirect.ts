import { Workflow } from "../../../common/workflow";
import { createForm } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { signedByTransporter } from "../steps/signedByTransporter";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsProcessed } from "../steps/markAsProcessed";

const workflow: Workflow = {
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
