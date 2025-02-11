import { signReception } from "../steps/signReception";
import { Workflow } from "../../../common/workflow";
import { createBsvhu } from "../steps/createBsvhu";
import { signForProducer } from "../steps/signForProducer";
import { signOperation } from "../steps/signOperation";
import { signTransport } from "../steps/signTransport";
import { updateDestination } from "../steps/updateDestination";
import { updateReception } from "../steps/updateReception";
import { updateTransporter } from "../steps/updateTransporter";

const workflow: Workflow = {
  title: `Acheminement d'un centre VHU vers un broyeur`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    {
      name: "broyeur",
      companyTypes: ["WASTE_VEHICLES", "WASTEPROCESSOR"],
      opt: { wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"] }
    }
  ],
  steps: [
    createBsvhu("producteur"),
    signForProducer("producteur"),
    updateTransporter("transporteur"),
    signTransport("transporteur"),
    updateReception("broyeur"),
    signReception("broyeur"),
    updateDestination("broyeur"),
    signOperation("broyeur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    broyeur: { siret: "SIRET_BROYEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createBsvhu| A(INITIAL)
A -->|"signBsvhu (EMISSION)"| B(SIGNED_BY_PRODUCTER)
B -->|updateBsvhu| B
B -->|"signBsvhu (TRANSPORT)"| C(SENT)
C -->|updateBsvhu| C
C -->|"signBsvhu (RECEPTION)" | D(RECEIVED)
D -->|updateBsvhu| D
D -->|"signBsvhu (OPERATION)"| E(PROCESSED)`
};

export default workflow;
