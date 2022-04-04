import { createBsdasri } from "../steps/createBsdasri";
import { signSecretCode } from "../steps/signSecretCode";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";
import { updateTransport } from "../steps/updateTransport";

export default {
  title: `Acheminement direct de la personne responsable de l'élimination
 des déchets PRED vers l'installation destinataire, signature via code secret transporteur`,
  companies: [
    { name: "pred", companyTypes: ["PRODUCER"], opt: { securityCode: 6543 } },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createBsdasri("pred"),
    signSecretCode("transporteur", 6543),
    updateTransport("transporteur"),
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
A -->|"signBsdasriEmissionWithSecretCode"| B(SIGNED_BY_PRODUCER)
B -->|updateBsdasri| B
B -->|"signBsdasri (TRANSPORT)"| C(SENT)
C -->|updateBsdasri| C
C -->|"signBsdasri (RECEPTION)"| D(RECEIVED)
D -->|updateBsdasri| D
D -->|"signBsdasri (OPERATION)"| PROCESSED`
};
