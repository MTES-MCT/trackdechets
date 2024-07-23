import { createDraftBspaoh } from "../steps/createDraftBspaoh";
import { publishBspaoh } from "../steps/publishBspaoh";
import { signForProducer } from "../steps/signForProducer";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";
import { updateTransport } from "../steps/updateTransport";

export default {
  title: `Acheminement direct du producteur des déchets vers le crématorium depuis le brouillon`,
  companies: [
    { name: "emetteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    {
      name: "crematorium",
      companyTypes: ["WASTEPROCESSOR"],
      opt: { wasteProcessorTypes: ["CREMATION"] }
    }
  ],
  steps: [
    createDraftBspaoh("emetteur"),
    publishBspaoh("emetteur"),
    signForProducer("emetteur"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("crematorium"),
    signReception("crematorium"),
    updateOperation("crematorium"),
    signOperation("crematorium")
  ],
  docContext: {
    emetteur: { siret: "SIRET_PRODUCTEUR" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    crematorium: { siret: "SIRET_CREMATORIUM" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createBspaoh| A(INITIAL)
A -->|"signBspaoh (EMISSION)"| B(SIGNED_BY_PRODUCER)
B -->|updateBspaoh| B
B -->|"signBspaoh (TRANSPORT)"| C(SENT)
C -->|updateBspaoh| C
C -->|"signBspaoh (RECEPTION)"| D(RECEIVED)
D -->|updateBspaoh| D
D -->|"signBspaoh (OPERATION)"| PROCESSED`
};
