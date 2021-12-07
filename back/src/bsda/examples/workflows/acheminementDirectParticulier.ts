import { Workflow } from "../../../common/workflow";
import fixtures from "../fixtures";
import { createBsda, createPrivateIndividualBsda } from "../steps/createBsda";
import { signBsda } from "../steps/signBsda";
import { updateBsda } from "../steps/updateBsda";

const workflow: Workflow = {
  title: "Acheminement d'un particulier à l'installation de traitement",
  description: `Les informations du BSDA sont remplies un des acteurs du bordereau.
Chaque entreprise appose ensuite tour à tout sa signature en complétant les informations du bordereau.`,
  companies: [
    { name: "worker", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createPrivateIndividualBsda("worker"),
    updateBsda("worker", fixtures.workerSignatureUpdateInput),
    signBsda("worker", "WORK"),
    updateBsda("transporteur", fixtures.transporterSignatureUpdateInput),
    signBsda("transporteur", "TRANSPORT"),
    updateBsda("traiteur", fixtures.destinationSignatureUpdateInput),
    signBsda("traiteur", "OPERATION")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    worker: { siret: "SIRET_WORKER" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsda: { id: "ID_BSD" }
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
