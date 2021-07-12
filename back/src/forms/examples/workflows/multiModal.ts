import { createFormMultiModal } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { markSegmentAsReadyToTakeOver } from "../steps/markSegmentAsReadyToTakeOver";
import { prepareSegment } from "../steps/prepareSegment";
import { takeOverSegment } from "../steps/takeOverSegment";
import { signedByTransporter } from "../steps/signedByTransporter";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsProcessed } from "../steps/markAsProcessed";
import { Workflow } from "../../../common/workflow";

const workflow: Workflow = {
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
  },
  chart: `
graph LR
AO(NO STATE) -->|createForm| A
A(DRAFT) -->|markAsSealed| B(SEALED)
B -->|signedByTransporter| C(SENT)
C -->|prepareSegment| C2(SENT)
C3(SENT) -->|markSegmentAsReadyToTakeOver| C4(SENT)
C4 -->|takeOverSegment| C5(SENT)
C5 --> |markAsReceived| D(ACCEPTED)
D --> |markAsProcessed| E(PROCESSED)`
};

export default workflow;
