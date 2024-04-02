import { createBsdaWithTransporters } from "../steps/createBsda";
import { Workflow } from "../../../common/workflow";
import { createBsdaTransporter } from "../steps/createBsdaTransporter";
import { updateBsdaTransporter } from "../steps/updateBsdaTransporter";
import { signBsda } from "../steps/signBsda";
import { updateBsdaTransporters, updateBsda } from "../steps/updateBsda";
import fixtures from "../fixtures";

const workflow: Workflow = {
  title: "Transport multi-modal",
  description:
    "En cas de transport multi-modal, plusieurs transporteurs peuvent être renseignés dans un ordre donné " +
    "grâce au champ `transporters`. Les transporteurs signent chacun à leur tour grâce à la mutation `signBsda` (type=TRANSPORT). " +
    "La liste des transporteurs peut être modifiée par n'importe quel acteur du bordereau tant que le bordereau " +
    "n'a pas été réceptionné sur l'installation de destination. À noter toutefois qu'un transporteur ne peut plus " +
    "être modifié ou supprimé dès lors qu'il a signé le bordereau.",
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "worker", companyTypes: ["PRODUCER", "WORKER"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur3", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    {
      ...createBsdaTransporter("producteur", "transporteur1"),
      description: "Crée un premier transporteur qui sera associé au bordereau."
    },
    {
      ...createBsdaTransporter("producteur", "transporteur2"),
      description: "Crée un second transporteur qui sera associé au bordereau."
    },
    createBsdaWithTransporters("producteur"),
    signBsda("producteur", "EMISSION"),
    signBsda("worker", "WORK"),
    {
      ...updateBsdaTransporter(
        "transporteur1",
        1,
        fixtures.transporterNSignatureUpdateInput
      ),
      description:
        "Le premier transporteur met à jour ses informations de signature"
    },
    {
      ...signBsda("transporteur1", "TRANSPORT"),
      description: "Le premier transporteur signe le bordereau"
    },
    {
      ...updateBsdaTransporter(
        "transporteur2",
        2,
        fixtures.transporterNSignatureUpdateInput
      ),
      description:
        "Le second transporteur met à jour ses informations de signature"
    },
    {
      ...signBsda("transporteur2", "TRANSPORT"),
      description: "Le second transporteur signe le bordereau"
    },
    {
      ...createBsdaTransporter("traiteur", "transporteur3"),
      description:
        "L'installation de destination affrète un troisième transporteur",
      setContext: (ctx, data) => ({
        ...ctx,
        updatedBsdaTransporters: [...ctx.bsdaTransporters, data.id]
      })
    },
    {
      ...updateBsdaTransporters("traiteur"),
      description: "Le troisième transporteur est ajouté sur le bordereau"
    },
    {
      ...updateBsdaTransporter(
        "transporteur3",
        3,
        fixtures.transporterNSignatureUpdateInput
      ),
      description:
        "Le troisième transporteur met à jour ses informations de signature"
    },
    {
      ...signBsda("transporteur3", "TRANSPORT"),
      description: "Le troisième transporteur signe le bordereau"
    },
    updateBsda("traiteur", fixtures.destinationSignatureUpdateInput),
    signBsda("traiteur", "OPERATION")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    worker: { siret: "SIRET_WORKER" },
    transporteur1: { siret: "SIRET_TRANSPORTEUR_1" },
    transporteur2: { siret: "SIRET_TRANSPORTEUR_2" },
    transporteur3: { siret: "SIRET_TRANSPORTEUR_3" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsda: { id: "ID_BSDA" },
    bsdaTransporters: ["ID_BSDA_TRANSPORTER_1", "ID_BSDA_TRANSPORTER_2"],
    updatedBsdaTransporters: [
      "ID_BSDA_TRANSPORTER_1",
      "ID_BSDA_TRANSPORTER_2",
      "ID_BSDA_TRANSPORTER_3"
    ]
  },
  chart: `
    graph LR
    AO(NO STATE) -->|createBsda| A
    A(INITIAL) -->|"signBsda(EMISSION)"| B(SIGNED_BY_PRODUCER)
    B -->|"signBsda(WORK)"| C(SIGNED_BY_WORKER)
    C --> |"signBsda(TRANSPORT)"| D(SENT)
    D -->|"signBsda(TRANSPORT)"| E(SENT)
    E -->|"signBsda(TRANSPORT)"| F(SENT)
    F --> |"signBsda(OPERATION)"| G(PROCESSED)
    `
};

export default workflow;
