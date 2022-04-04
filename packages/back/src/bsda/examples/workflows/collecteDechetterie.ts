import { Workflow } from "../../../common/workflow";
import fixtures from "../fixtures";
import { create2710Bsda } from "../steps/createBsda";
import { signBsda } from "../steps/signBsda";
import { updateBsda } from "../steps/updateBsda";

const workflow: Workflow = {
  title: "Collecte d'amiante dans une déchetterie",
  description: `Une entreprise "Rénov" vient déposer des déchets dans une déchetterie.
  Cette déchetterie décide de lui donner un bordereau.
  Elle renseigne les informations du maître d’ouvrage, des déchets et s'indique elle même en tant qu'installation de destination.
  Il n'y a ni entreprise de travaux ni transporteur.
  La déchetterie est l'unique signataire du bordereau.
  Le BSDA est disponible sur la plateforme pour les deux acteurs du bordereau.
  `,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "worker", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    create2710Bsda("traiteur"),
    updateBsda("traiteur", fixtures.destinationSignatureUpdateInput),
    signBsda("traiteur", "OPERATION")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsda: { id: "ID_BSD" }
  },
  chart: `
    graph LR
    AO(NO STATE) -->|createForm| A
    A(INITIAL) -->|signBsda| B(PROCESSED)
    `
};

export default workflow;
