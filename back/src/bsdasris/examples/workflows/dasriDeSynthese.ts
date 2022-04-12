import {
  createBsdasri1ToAssociate,
  createBsdasri2ToAssociate
} from "../steps/createBsdasriToAssociate";
import { createSynthesisBsdasri } from "../steps/createSynthesisBsdasri";
import { signForProducer } from "../steps/signForProducer";
import { updateTransport } from "../steps/updateTransport";
import { updateSynthesisTransport } from "../steps/updateSynthesisTransport";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";

export default {
  title: `Bordereau de synthèse`,
  description: `Création dun bordereau dasri de synthèse. 
 `,
  companies: [
    {
      name: "pred",
      companyTypes: ["PRODUCER"]
    },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    // dasri 1
    createBsdasri1ToAssociate("pred"),
    signForProducer("pred"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    // dasri 2
    createBsdasri2ToAssociate("pred"),
    signForProducer("pred"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    // synthesis dasri
    createSynthesisBsdasri("transporteur"),
    updateSynthesisTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteur"),
    signReception("traiteur"),
    updateOperation("traiteur"),
    signOperation("traiteur")
  ],
  docContext: {
    pred: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createBsdasri| A(INITIAL)
A -->|updateBsdasri| A
A -->|"signBsdasri (TRANSPORT)"| B(SENT)
B -->|updateBsdasri| B
B -->|"signBsdasri (RECEPTION)"| C(RECEIVED)
C -->|updateBsdasri| C
C -->|"signBsdasri (OPERATION)"| PROCESSED`
};
