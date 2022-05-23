import { createFormMultiModal } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { markSegmentAsReadyToTakeOver } from "../steps/markSegmentAsReadyToTakeOver";
import { prepareSegment } from "../steps/prepareSegment";
import { takeOverSegment } from "../steps/takeOverSegment";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsProcessed } from "../steps/markAsProcessed";
import { Workflow } from "../../../common/workflow";
import { signEmissionForm } from "../steps/signEmissionForm";
import { signTransportForm } from "../steps/signTransportForm";

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
    signEmissionForm("producteur"),
    signTransportForm("transporteur1"),
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
NO_STATE(NO STATE) --> |createForm| DRAFT
DRAFT --> |markAsSealed| SEALED
SEALED --> |signEmissionForm| SIGNED_BY_PRODUCER
SIGNED_BY_PRODUCER --> |signTransportForm| SENT
SENT --> |prepareSegment| SENT2(SENT)
SENT3(SENT) --> |markSegmentAsReadyToTakeOver| SENT4(SENT)
SENT4 --> |takeOverSegment| SENT5(SENT)
SENT5 --> |markAsReceived| ACCEPTED
ACCEPTED --> |markAsProcessed| PROCESSED`
};

export default workflow;
