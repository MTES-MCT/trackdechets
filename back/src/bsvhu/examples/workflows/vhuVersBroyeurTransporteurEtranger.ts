import { Workflow } from "../../../common/workflow";
import { createBsvhu } from "../steps/createBsvhu";
import { signForProducer } from "../steps/signForProducer";
import { signOperation } from "../steps/signOperation";
import { signTransport } from "../steps/signTransport";
import { updateForeignTransporter } from "../steps/updateTransporter";
import { updateDestination } from "../steps/updateDestination";
import fixtures from "../fixturesForeignTransporter";

const workflow: Workflow = {
  title: `Acheminement d'un centre VHU vers un broyeur par un transporteur étranger`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    {
      name: "transporteur",
      companyTypes: ["TRANSPORTER"],
      opt: {
        vatNumber: "BE0541696005",
        siret: null
      }
    },
    {
      name: "broyeur",
      companyTypes: ["WASTE_VEHICLES", "WASTEPROCESSOR"],
      opt: { wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"] }
    }
  ],
  steps: [
    createBsvhu("producteur", fixtures as any),
    signForProducer("producteur"),
    updateForeignTransporter("transporteur"),
    signTransport("transporteur"),
    updateDestination("broyeur"),
    signOperation("broyeur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { vatNumber: "VAT_TRANSPORTEUR" },
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
C -->|"signBsvhu (OPERATION)"| D(PROCESSED)`
};

export default workflow;
