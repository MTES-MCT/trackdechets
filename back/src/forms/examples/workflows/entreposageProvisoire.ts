import { createFormTempStorage } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import {
  signedByTransporter,
  signedByTransporterAfterTempStorage
} from "../steps/signedByTransporter";
import { markAsTempStored } from "../steps/markAsTempStored";
import { markAsResealed } from "../steps/markAsResealed";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsProcessed } from "../steps/markAsProcessed";
import { Workflow } from "../../../common/workflow";

const workflow: Workflow = {
  title: "Entreposage provisoire",
  description: `Les informations principales du BSDD sont remplies par l'émetteur du bordereau
en précisant isTempStorage=true dans les informations de destination. Le destinataire correspond à
l'installation d'entreposage provisoire. La signature de l'envoi se fait sur le terminal du transporteur
grâce au code de signature de l'émetteur. L'installation d'entreposage provisoire accepte les déchets
et complète les informations du second transporteur et de la destination finale (si ce n'est pas déjà fait par l'émetteur).
La signature de l'envoi après entreposage provisoire se fait sur le terminal du transporteur n°2 grâce au code de signature de
l'installation d'entreposage provisoire. L'installation de destination finale accepte le déchet et valide
le traitement.`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    { name: "ttr", companyTypes: ["COLLECTOR"] },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createFormTempStorage("producteur"),
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
  },
  chart: `
graph LR
AO(NO STATE) -->|createForm| A
A(DRAFT) -->|markAsSealed| B(SEALED)
B -->|signedByTransporter| C(SENT)
C -->|markAsTempStored| D1(TEMP_STORER_ACCEPTED)
D2(TEMP_STORER_ACCEPTED) --> |markAsResealed| E(RESEALED)
E --> |signedByTransporter| F(RESENT)
F --> |markAsReceived| G(RECEIVED)
G --> |markAsProcessed| H(PROCESSED)`
};

export default workflow;
