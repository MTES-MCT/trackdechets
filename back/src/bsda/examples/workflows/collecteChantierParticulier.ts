import { Workflow } from "../../../common/workflow";
import fixtures from "../fixtures";
import { createPrivateIndividualBsda } from "../steps/createBsda";
import { signBsda } from "../steps/signBsda";
import { updateBsda } from "../steps/updateBsda";

const workflow: Workflow = {
  title: "Collecte d'amiante sur un chantier d'un particulier",
  description: `L’entreprise “Gedésamiante” intervient chez un particulier.
  “Gedésamiante” décide de faire le BSDA pour son client.
  Elle indique que le maître d’ouvrage est un particulier. (case à cocher sur Trackdéchets) et renseigne les informations la concernant (nom, adresse, etc). Le particulier ne signera pas le BSDA. Cette étape est ignorée dans Trackdéchets.
  Il va renseigner les informations du maître d’ouvrage, des déchets, de l’installation de destination et de son entreprise.
  L’entreprise de travaux finalise les conditionnement et peut ajuster les quantités. Elle peut ajouter les scellés si ce n’est pas déjà fait.
  Quand elle signe en cadre 5.2, elle fige les informations jusqu’à ce cadre.
  Le transporteur identifié sur le BSDA peut alors venir sur le chantier, vérifier les conditionnements et scellés, compléter la partie le concernant si besoin (nom, date, immatriculation etc) et signer l'enlèvement pour acheminer le déchets vers l’installation de destination prévue.
  L’installation de destination accepte le lot, effectue une pesée qu’elle renseigne.
  Elle indique en cadre 8 l’opération réalisée, ajoute la date et signe sur Trackdéchets.
  Le BSDA est disponible sur la plateforme pour tous les acteurs.
  `,
  companies: [
    { name: "worker", companyTypes: ["PRODUCER", "WORKER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    createPrivateIndividualBsda("worker"),
    updateBsda("worker", fixtures.workerSignatureUpdateInput),
    signBsda("worker", "WORK"),
    updateBsda("transporteur", fixtures.transporterSignatureUpdateInput),
    signBsda("transporteur", "TRANSPORT"),
    updateBsda("traiteur", fixtures.destinationSignatureUpdateInput),
    signBsda("traiteur", "OPERATION")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    worker: { siret: "SIRET_WORKER" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsda: { id: "ID_BSD" }
  },
  chart: `
    graph LR
    AO(NO STATE) -->|createForm| A
    A(INITIAL) -->|signBsda| B(SIGNED_BY_WORKER)
    B -->|signBsda| C(SENT)
    C --> |signBsda| D(PROCESSED)
    `
};

export default workflow;
