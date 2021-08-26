import { createBsdasri } from "../steps/createBsdasri";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";
import { updateTransportBeforeDirectTakeover } from "../steps/updateTransportBeforeDirectTakeover";
export default {
  title: `Emport direct d'un dasri dans signature producteur`,
  description: `L'emport d'un dasri (hors groupement) par un transporteur, sans signature producteur, est possible si ce dernier l'a autorisé (champ allowBsdasriTakeOverWithoutSignature).`,
  companies: [
    {
      name: "pred",
      companyTypes: ["PRODUCER"],
      opt: { allowBsdasriTakeOverWithoutSignature: true }
    },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createBsdasri("pred"),
    updateTransportBeforeDirectTakeover("transporteur"),
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
