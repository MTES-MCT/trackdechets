import { Workflow } from "../../../common/workflow";
import {
  createAppendix1Form,
  createAppendix1ProducerForm
} from "../steps/createForm";
import { markAsProcessed } from "../steps/markAsProcessed";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsSealed } from "../steps/markAsSealed";
import { signEmissionForm } from "../steps/signEmissionForm";
import { signTransportForm } from "../steps/signTransportForm";
import {
  groupAppendix1Producer,
  switchAppendixContext
} from "../steps/updateForm";

const workflow: Workflow = {
  title: "Bordereau chapeau et annexe 1",
  description: `Le collecteur crée un bordereau chapeau. Il crée ensuite ses bordereaux d'annexe 1 et les rattache à ce chapeau.
  Les bordereaux d'annexe 1 doivent alors être signé par l'émetteur et le transporteur, ou uniquement le transporteur selon les cas. Puis enfin le chapeau sera signé par l'éxutoire.`,
  companies: [
    { name: "collecteur", companyTypes: ["COLLECTOR", "TRANSPORTER"] },
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createAppendix1Form("collecteur"),
    markAsSealed("collecteur"),
    createAppendix1ProducerForm("collecteur"),
    groupAppendix1Producer("collecteur"),
    signEmissionForm("producteur"),
    signTransportForm("collecteur"),
    switchAppendixContext("collecteur"),
    markAsReceived("traiteur"),
    markAsProcessed("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    collecteur: { siret: "SIRET_COLLECTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    chapeau: { id: "ID_BSD_CHAPEAU" },
    appendix1Items: [{ id: "ID_BSD_ANNEXE1" }],
    bsd: { id: "ID_BSD_CHAPEAU" }
  },
  chart: `
  graph LR
  NO_STATE(NO STATE) --> |createAppendix1Form| DRAFT
  DRAFT --> |markAsSealed| SEALED
  SEALED --> |Création des annexes 1| SEALED
  SEALED --> |Signature des annexes 1| SENT
  SENT --> |markAsReceived| RECEIVED
  RECEIVED --> |markAsProcessed| PROCESSED`
};

export default workflow;
