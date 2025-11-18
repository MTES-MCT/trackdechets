import { createForm } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { importPaperForm } from "../steps/importPaperForm";
import { Workflow } from "../../../common/workflow";
import { WasteProcessorType } from "@td/prisma";

const workflow: Workflow = {
  title: `Acheminement direct du producteur à l'installation de traitement avec import de BSD signé papier.`,
  description: `Le bordereau est préparé initialement dans Trackdéchets puis imprimé
au moment de l'enlèvement par le transporteur. Le BSD papier accompagne
le déchet jusqu'au traitement final puis les données sont ré-importés
dans Trackdéchets par l'installation de destination pour assurer la traçabilité numérique`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    {
      name: "traiteur",
      companyTypes: ["WASTEPROCESSOR"],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    }
  ],
  steps: [
    createForm("producteur"),
    markAsSealed("producteur"),
    importPaperForm("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createForm| A
A(DRAFT) -->|markAsSealed| B(SEALED)
B -->|importPaperForm| C(PROCESSED)`
};

export default workflow;
