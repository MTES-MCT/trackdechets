import { Workflow } from "../../../common/workflow";
import { createBsda } from "../steps/createBsda";
import { signBsda } from "../steps/signBsda";

const workflow: Workflow = {
  title: "Acheminement direct du producteur à l'installation de traitement",
  description: `Les informations du BSDA sont remplies un des acteurs du bordereau (ici le producteur du déchet).
Chaque acteur appose ensuite tour à tout sa signature en complétant les informations du bordereau.`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "entreprise de travaux", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createBsda("producteur"),
    signBsda("producteur", "EMISSION"),
    updateBsda("worker", {}),
    signBsda("worker", "WORK"),
    updateBsda("transporteur", {}),
    signBsda("transporteur", "TRANSPORT"),
    updateBsda("traiteur", {}),
    signBsda("traiteur", "OPERATION")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    worker: { siret: "SIRET_WORKER" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
    graph LR
    AO(NO STATE) -->|createForm| A
    A(INITIAL) -->|signBsda| B(SIGNED_BY_PRODUCER)
    B -->|signBsda| C(SIGNED_BY_WORKER)
    C --> |signBsda| D(SENT)
    D --> |signBsda| E(PROCESSED)
    `
};

export default workflow;
