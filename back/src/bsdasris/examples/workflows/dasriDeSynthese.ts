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
  description: `Création dun bordereau dasri de synthèse.\n
  Le dasri de synthèse permet à un transporteur de regrouper différents bordereaux qu'il vient de collecter dans un seul bordereau.
  Le dasri de synthèse est donc réservé aux transporteurs.
  La création de brouillon n'est pas permise.
  Un dasri de synthèse ne peut être refusé ou partiellement accepté.
  Lors de la création, les champs relatifs à l'émetteur ne sont pas attendus, le transporteur sera considéré comme émetteur.
  Au cours du cycle de vie du bsd de synthèse, les information de réception et traitement des bsds associés sont mises à jour.
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
    bsd: { id: "ID_BSD" },
    bsdasri1: { id: "ID_BSD_SYNTHESE_1" },
    bsdasri2: { id: "ID_BSD_SYNTHESE_2" }
  },
  chart: `
graph LR
AO[(BSDasris à grouper)] -->|createBsdasri| A(INITIAL)
A -->|updateBsdasri| A
A -->|"signBsdasri (TRANSPORT)"| B(SENT)
B -->|updateBsdasri| B
B -->|"signBsdasri (RECEPTION)"| C(RECEIVED)
C -->|updateBsdasri| C
C -->|"signBsdasri (OPERATION)"| PROCESSED`
};
