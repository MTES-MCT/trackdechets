import { Workflow } from "../../../common/workflow";
import { createInitialForm, createGroupementForm } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsAwaitingGroup } from "../steps/markAsProcessed";
import { signEmissionForm } from "../steps/signEmissionForm";
import { signTransportForm } from "../steps/signTransportForm";
import fixtures from "../fixturesForeignTransporter";
import { WasteProcessorType, CollectorType } from "@td/prisma";

const workflow: Workflow = {
  title:
    "Émission d’un BSDD de regroupement, pour la personne ayant transformé ou réalisé un" +
    " traitement dont la provenance des déchets reste identifiable avec un transporteur étranger",
  description:
    "Installation recevant des déchets et les réexpédiant, après" +
    " avoir procédé à leur déconditionnement et reconditionnement, voire leur" +
    " sur-conditionnement, pour constituer des lots de taille plus importante. Les opérations de" +
    " déconditionnement / reconditionnement ne doivent pas conduire au mélange de déchets de" +
    " nature et catégorie différentes. Par exemple, la mise en balle de déchets non dangereux" +
    " (filmage, compactage, ...) est une opération de regroupement.`",
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    {
      name: "transporteur",
      companyTypes: ["TRANSPORTER"],
      opt: { siret: null, vatNumber: "BE0541696005" }
    },
    {
      name: "ttr",
      companyTypes: ["COLLECTOR"],
      collectorTypes: [CollectorType.DANGEROUS_WASTES]
    },
    {
      name: "transporteur2",
      companyTypes: ["TRANSPORTER"],
      opt: { siret: null, vatNumber: "RO17579668" }
    },
    {
      name: "traiteur",
      companyTypes: ["WASTEPROCESSOR"],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    }
  ],
  steps: [
    createInitialForm("producteur", fixtures as any),
    markAsSealed("producteur"),
    signEmissionForm("producteur"),
    signTransportForm("transporteur"),
    markAsReceived("ttr"),
    markAsAwaitingGroup("ttr"),
    createGroupementForm("ttr", fixtures as any)
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: 1234 },
    transporteur: { vatNumber: "VAT_TRANSPORTEUR" },
    transporteur2: { vatNumber: "VAT_TRANSPORTEUR_2" },
    ttr: { siret: "SIRET_TTR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" },
    initialBsd: { id: "ID_INITIAL_BSD", quantityReceived: 1.0 }
  },
  chart: `
graph LR
ACCEPTED --> |markAsProcessed sur le BSD initial| AWAITING_GROUP
AWAITING_GROUP --> |markAsSealed sur le BSD de regroupement | GROUPED
GROUPED --> |markAsProcessed  sur le BSD de regroupement | PROCESSED
`
};

export default workflow;
