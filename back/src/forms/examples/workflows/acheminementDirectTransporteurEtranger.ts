import { Workflow } from "../../../common/workflow";
import { createForm } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsProcessed } from "../steps/markAsProcessed";
import { signEmissionForm } from "../steps/signEmissionForm";
import { signTransportForm } from "../steps/signTransportForm";
import fixtures from "../fixturesForeignTransporter";
import { WasteProcessorType } from "@td/prisma";
const workflow: Workflow = {
  title:
    "Acheminement direct du producteur à l'installation de traitement avec un transporteur étranger",
  description: `Les informations du BSDD sont remplies par le producteur du déchet.
  L'émetteur signe l'envoi suivit par le transporteur étranger puis le déchet est accepté
  et traité à l'installation de destination.`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    {
      name: "transporteur",
      companyTypes: ["TRANSPORTER"],
      opt: {
        siret: null,
        vatNumber: "BE0541696005"
      }
    },
    {
      name: "traiteur",
      companyTypes: ["WASTEPROCESSOR"],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    }
  ],
  steps: [
    createForm("producteur", fixtures as any),
    markAsSealed("producteur"),
    signEmissionForm("producteur"),
    signTransportForm("transporteur"),
    markAsReceived("traiteur"),
    markAsProcessed("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: 1234 },
    transporteur: { vatNumber: "VAT_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
NO_STATE(NO STATE) --> |createForm| DRAFT
DRAFT --> |markAsSealed| SEALED
SEALED --> |signEmissionForm| SIGNED_BY_PRODUCER
SIGNED_BY_PRODUCER --> |signTransportForm| SENT
SENT --> |markAsReceived| ACCEPTED
ACCEPTED --> |markAsProcessed| PROCESSED`
};

export default workflow;
