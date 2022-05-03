import { createBsdasriEcoorganisme } from "../steps/createBsdasriEcoorganisme";
import { signForEcoOrganisme } from "../steps/signForEcoorganisme";
import { signOperation } from "../steps/signOperation";
import { signReception } from "../steps/signReception";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { updateOperation } from "../steps/updateOperation";
import { updateTransport } from "../steps/updateTransport";

export default {
  title: `Acheminement direct de l'éco organisme vers l'installation destinataire`,
  companies: [
    { name: "pred", companyTypes: ["PRODUCER"] },
    {
      name: "ecoOrganisme",
      companyTypes: ["ECO_ORGANISME"],
      opt: { securityCode: 9876 }
    },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createBsdasriEcoorganisme("pred"),
    signForEcoOrganisme("ecoOrganisme"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteur"),
    signReception("traiteur"),
    updateOperation("traiteur"),
    signOperation("traiteur")
  ],
  docContext: {
    pred: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    ecoOrganisme: { siret: "SIRET_ECO_ORGANISME", securityCode: "YYYY" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createBsdasri| A(INITIAL)
A -->|"signBsdasri (EMISSION par éco-organisme)"| B(SIGNED_BY_PRODUCER)
B -->|updateBsdasri| B
B -->|"signBsdasri (TRANSPORT)"| C(SENT)
C -->|updateBsdasri| C
C -->|"signBsdasri (RECEPTION)"| D(RECEIVED)
D -->|updateBsdasri| D
D -->|"signBsdasri (OPERATION)"| PROCESSED`
};
