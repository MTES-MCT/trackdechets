import { Workflow } from "../../../common/workflow";
import fixtures from "../fixtures";
import {
  createBsda1ToGroup,
  createBsda2ToGroup
} from "../steps/createBsdaToGroup";
import { createGroupingBsda } from "../steps/createGroupingBsda";
import { signBsda, signBsdaToGroup } from "../steps/signBsda";
import { updateBsda } from "../steps/updateBsda";

const workflow: Workflow = {
  title: "Groupement de déchets",
  description: `Un traiteur a 2 bordereaux qu'il souhaite grouper. Après la crétation des 2 bordereaux initiaux, un bordereau de groupement est créé.`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "worker", companyTypes: ["PRODUCER", "WORKER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] },
    { name: "traiteur2", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    // BSDA 1
    createBsda1ToGroup("producteur"),
    signBsdaToGroup("producteur", "EMISSION"),
    signBsdaToGroup("worker", "WORK"),
    signBsdaToGroup("transporteur", "TRANSPORT"),
    signBsdaToGroup("traiteur", "OPERATION"),
    // BSDA 2
    createBsda2ToGroup("producteur"),
    signBsdaToGroup("producteur", "EMISSION"),
    signBsdaToGroup("worker", "WORK"),
    signBsdaToGroup("transporteur", "TRANSPORT"),
    signBsdaToGroup("traiteur", "OPERATION"),
    // Grouping
    createGroupingBsda("traiteur"),
    signBsda("traiteur", "EMISSION"),
    updateBsda("transporteur", fixtures.transporterSignatureUpdateInput),
    signBsda("transporteur", "TRANSPORT"),
    updateBsda("traiteur2", fixtures.destinationSignatureUpdateInput),
    signBsda("traiteur2", "OPERATION")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    worker: { siret: "SIRET_WORKER" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR_1" },
    traiteur2: { siret: "SIRET_TRAITEUR_2" },
    bsda: { id: "ID_BSD" },
    bsda_1: { id: "ID_BSD_GROUPE_1" },
    bsda_2: { id: "ID_BSD_GROUPE_2" }
  },
  chart: `
    graph LR
    A0[(BSDAs à grouper)] -->|createForm| A
    A(INITIAL) -->|signBsda| B(SIGNED_BY_PRODUCER)
    B -->|signBsda| C(SIGNED_BY_WORKER)
    C --> |signBsda| D(SENT)
    D --> |signBsda| E(PROCESSED)
    `
};

export default workflow;
