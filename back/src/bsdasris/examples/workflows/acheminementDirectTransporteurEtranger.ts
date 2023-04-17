import fixtures from "../fixturesForeignTransporter";
import { createBsdasri } from "../steps/createBsdasri";
import { signForProducer } from "../steps/signForProducer";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";
import { updateTransport } from "../steps/updateTransport";

export default {
  title: `Acheminement direct de la personne responsable de l'élimination
 des déchets PRED vers l'installation destinataire par un transporteur étranger`,
  companies: [
    { name: "pred", companyTypes: ["PRODUCER"] },
    {
      name: "transporteur",
      companyTypes: ["TRANSPORTER"],
      opt: {
        siret: null,
        vatNumber: "BE0541696005"
      }
    },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createBsdasri("pred", fixtures as any),
    signForProducer("pred"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteur"),
    signReception("traiteur"),
    updateOperation("traiteur"),
    signOperation("traiteur")
  ],
  docContext: {
    pred: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { vatNumber: "VAT_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createBsdasri| A(INITIAL)
A -->|"signBsdasri (EMISSION)"| B(SIGNED_BY_PRODUCER)
B -->|updateBsdasri| B
B -->|"signBsdasri (TRANSPORT)"| C(SENT)
C -->|updateBsdasri| C
C -->|"signBsdasri (RECEPTION)"| D(RECEIVED)
D -->|updateBsdasri| D
D -->|"signBsdasri (OPERATION)"| PROCESSED`
};
