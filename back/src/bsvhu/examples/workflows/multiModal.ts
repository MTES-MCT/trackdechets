import { createBsvhuWithTransporters } from "../steps/createBsvhu";
import { Workflow } from "../../../common/workflow";
import { createBsvhuTransporter } from "../steps/createBsvhuTransporter";
import { updateBsvhuTransporter } from "../steps/updateBsvhuTransporter";
import { updateTransporters } from "../steps/updateTransporter";
import { signForProducer } from "../steps/signForProducer";
import { signOperation } from "../steps/signOperation";
import { signTransport } from "../steps/signTransport";
import { signReception } from "../steps/signReception";
import { updateDestination } from "../steps/updateDestination";
import { updateReception } from "../steps/updateReception";
import fixtures from "../fixtures";

const workflow: Workflow = {
  title: "Transport multi-modal",
  description:
    "En cas de transport multi-modal, plusieurs transporteurs peuvent être renseignés dans un ordre donné " +
    "grâce au champ `transporters`. Les transporteurs signent chacun à leur tour grâce à la mutation `signBsvhu` (type=TRANSPORT). " +
    "La liste des transporteurs peut être modifiée par n'importe quel acteur du bordereau tant que le bordereau " +
    "n'a pas été réceptionné sur l'installation de destination. À noter toutefois qu'un transporteur ne peut plus " +
    "être modifié ou supprimé dès lors qu'il a signé le bordereau.",
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur3", companyTypes: ["TRANSPORTER"] },
    {
      name: "broyeur",
      companyTypes: ["WASTE_VEHICLES", "WASTEPROCESSOR"],
      opt: { wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"] }
    }
  ],
  steps: [
    {
      ...createBsvhuTransporter("producteur", "transporteur1"),
      description: "Crée un premier transporteur qui sera associé au bordereau."
    },
    {
      ...createBsvhuTransporter("producteur", "transporteur2"),
      description: "Crée un second transporteur qui sera associé au bordereau."
    },
    createBsvhuWithTransporters("producteur"),
    signForProducer("producteur"),
    {
      ...updateBsvhuTransporter(
        "transporteur1",
        1,
        fixtures.transporterNSignatureUpdateInput
      ),
      description:
        "Le premier transporteur met à jour ses informations de signature"
    },
    {
      ...signTransport("transporteur1"),
      description: "Le premier transporteur signe le bordereau"
    },
    {
      ...updateBsvhuTransporter(
        "transporteur2",
        2,
        fixtures.transporterNSignatureUpdateInput
      ),
      description:
        "Le second transporteur met à jour ses informations de signature"
    },
    {
      ...signTransport("transporteur2"),
      description: "Le second transporteur signe le bordereau"
    },
    {
      ...createBsvhuTransporter("broyeur", "transporteur3"),
      description: "Le broyeur affrète un troisième transporteur",
      setContext: (ctx, data) => ({
        ...ctx,
        updatedBsvhuTransporters: [...ctx.bsvhuTransporters, data.id]
      })
    },
    {
      ...updateTransporters("broyeur"),
      description: "Le troisième transporteur est ajouté sur le bordereau"
    },
    {
      ...updateBsvhuTransporter(
        "transporteur3",
        3,
        fixtures.transporterNSignatureUpdateInput
      ),
      description:
        "Le troisième transporteur met à jour ses informations de signature"
    },
    {
      ...signTransport("transporteur3"),
      description: "Le troisième transporteur signe le bordereau"
    },
    updateReception("broyeur"),
    signReception("broyeur"),
    updateDestination("broyeur"),
    signOperation("broyeur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur1: { siret: "SIRET_TRANSPORTEUR_1" },
    transporteur2: { siret: "SIRET_TRANSPORTEUR_2" },
    transporteur3: { siret: "SIRET_TRANSPORTEUR_3" },
    broyeur: { siret: "SIRET_BROYEUR" },
    bsd: { id: "ID_BSD" },
    bsvhuTransporters: ["ID_BSVHU_TRANSPORTER_1", "ID_BSVHU_TRANSPORTER_2"],
    updatedBsvhuTransporters: [
      "ID_BSVHU_TRANSPORTER_1",
      "ID_BSVHU_TRANSPORTER_2",
      "ID_BSVHU_TRANSPORTER_3"
    ]
  },
  chart: `
    graph LR

    AO(NO STATE) -->|createBsvhu| A(INITIAL)
    A -->|"signBsvhu (EMISSION)"| B(SIGNED_BY_PRODUCTER)
    B -->|"signBsvhu (TRANSPORT)"| C(SENT)
    C -->|"signBsvhu (TRANSPORT)"| D(SENT)
    D -->|"signBsvhu (TRANSPORT)"| E(SENT)
    E -->|"signBsvhu (RECEPTION)" | F(RECEIVED)
    F -->|"signBsvhu (OPERATION)"| G(PROCESSED)
    `
};

export default workflow;
