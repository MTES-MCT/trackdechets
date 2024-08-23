import { createBsdasri } from "../steps/createBsdasri";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";
import { updateTransportBeforeDirectTakeover } from "../steps/updateTransportBeforeDirectTakeover";
export default {
  title: `Emport direct d'un dasri sans signature producteur`,
  description: `Habituellement, l'emport d'un dasri nécessite la signature du producteur. 
  Néanmoins, ce dernier peut autoriser l'emport direct par un transporteur, sans signature producteur. 
  Cette facilité est possible pour les dasris simples (hors groupement).
  Le producteur doit pour ce faire cocher la case "Emport direct de DASRI autorisé" dans Mes établissements.
  En termes d'api, ce paramétrage correspond au champ "allowBsdasriTakeOverWithoutSignature" accessible sur la query "companyInfos".`,
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
