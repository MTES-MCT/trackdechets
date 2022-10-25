import {
  createBsdasri1ToGroup,
  createBsdasri2ToGroup
} from "../steps/createBsdasriToGroup";
import { createGroupingBsdasri } from "../steps/createGroupingBsdasri";
import { signForProducer } from "../steps/signForProducer";
import { updateTransport } from "../steps/updateTransport";

import { signGroupingOperation } from "../steps/signGroupingOperation";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";
import { updateOperationForGrouping } from "../steps/updateOperationForGrouping";

export default {
  title: `Bordereau de groupement`,
  description: `Création dun bordereau dasri de groupement.`,
  companies: [
    {
      name: "pred",
      companyTypes: ["PRODUCER"]
    },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["COLLECTOR"] },
    { name: "traiteurFinal", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    // dasri 1
    createBsdasri1ToGroup("pred"),
    signForProducer("pred"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteur"),
    signReception("traiteur"),
    updateOperationForGrouping("traiteur"),
    signGroupingOperation("traiteur"),
    // dasri 2
    createBsdasri2ToGroup("pred"),
    signForProducer("pred"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteur"),
    signReception("traiteur"),
    updateOperationForGrouping("traiteur"),
    signGroupingOperation("traiteur"),
    // grouping dasri
    createGroupingBsdasri("traiteur"),
    signForProducer("traiteur"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteurFinal"),
    signReception("traiteurFinal"),
    updateOperation("traiteurFinal"),
    signOperation("traiteurFinal")
  ],
  docContext: {
    pred: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    traiteurFinal: { siret: "SIRET_TRAITEUR_FINAL" },
    bsd: { id: "ID_BSD" },
    bsdasri1: { id: "ID_BSD_GROUPEMENT_1" },
    bsdasri2: { id: "ID_BSD_GROUPEMENT_2" }
  },
  chart: `
graph LR
AO[(BSDasris à grouper)] -->|createBsdasri| A(INITIAL)
A -->|"signBsdasri (EMISSION)"| B(SIGNED_BY_PRODUCER)
B -->|updateBsdasri| B
B -->|"signBsdasri (TRANSPORT)"| C(SENT)
C -->|updateBsdasri| C
C -->|"signBsdasri (RECEPTION)"| D(RECEIVED)
D -->|updateBsdasri| D
D -->|"signBsdasri (OPERATION)"| PROCESSED`
};
