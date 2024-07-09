import { Workflow } from "../../../common/workflow";
import { createBsffWithTransporters } from "../steps/createBsff";
import { createBsffTransporter } from "../steps/createBsffTransporter";
import { signEmission } from "../steps/signEmission";
import { updateBsffTransporter } from "../steps/updateBsffTransporter";
import fixtures from "../fixtures";
import { signTransport } from "../steps/signTransport";
import { updateBsffTransporters } from "../steps/updateBsffTransporters";
import { updateReception } from "../steps/updateReception";
import { signReception } from "../steps/signReception";
import { updateAcceptation } from "../steps/updateAcceptation";
import { signAcceptation } from "../steps/signAcceptation";
import { updateOperationD13 } from "../steps/updateOperation";
import { signOperation } from "../steps/signOperation";

const workflow: Workflow = {
  title: "Transport multi-modal",
  description:
    "En cas de transport multi-modal, plusieurs transporteurs peuvent être renseignés dans un ordre donné " +
    "grâce au champ `transporters`. Les transporteurs signent chacun à leur tour grâce à la mutation `signBsff` (type=TRANSPORT). " +
    "La liste des transporteurs peut être modifiée par n'importe quel acteur du bordereau tant que le bordereau " +
    "n'a pas été réceptionné sur l'installation de destination. À noter toutefois qu'un transporteur ne peut plus " +
    "être modifié ou supprimé dès lors qu'il a signé le bordereau.",
  companies: [
    { name: "operateur", companyTypes: ["PRODUCER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur3", companyTypes: ["TRANSPORTER"] }
  ],
  steps: [
    {
      ...createBsffTransporter("operateur", "transporteur1"),
      description: "Crée un premier transporteur qui sera associé au bordereau."
    },
    {
      ...createBsffTransporter("operateur", "transporteur2"),
      description: "Crée un second transporteur qui sera associé au bordereau."
    },
    createBsffWithTransporters("operateur"),
    signEmission("operateur"),
    {
      ...updateBsffTransporter(
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
      ...updateBsffTransporter(
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
      ...createBsffTransporter("traiteur", "transporteur3"),
      description:
        "L'installation de destination affrète un troisième transporteur",
      setContext: (ctx, data) => ({
        ...ctx,
        updatedBsffTransporters: [...ctx.bsffTransporters, data.id]
      })
    },
    {
      ...updateBsffTransporters("traiteur"),
      description: "Le troisième transporteur est ajouté sur le bordereau"
    },
    {
      ...updateBsffTransporter(
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
    updateReception("traiteur"),
    signReception("traiteur"),
    updateAcceptation("traiteur", { packagingIdx: 0 }),
    signAcceptation("traiteur"),
    updateOperationD13("traiteur", { packagingIdx: 0 }),
    signOperation("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    operateur: { siret: "SIRET_OPERATEUR" },
    transporteur1: { siret: "SIRET_TRANSPORTEUR_1" },
    transporteur2: { siret: "SIRET_TRANSPORTEUR_2" },
    transporteur3: { siret: "SIRET_TRANSPORTEUR_3" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsff: { id: "ID_BSFF" },
    bsffTransporters: ["ID_BSFF_TRANSPORTER_1", "ID_BSFF_TRANSPORTER_2"],
    updatedBsffTransporters: [
      "ID_BSFF_TRANSPORTER_1",
      "ID_BSFF_TRANSPORTER_2",
      "ID_BSFF_TRANSPORTER_3"
    ],
    packagings: [{ id: "ID_PACKAGING_1" }]
  },
  chart: `
  graph LR
  AO(NO STATE) -->|createBsff| A
  A(INITIAL) -->|"signBsff(EMISSION)"| C(SIGNED_BY_PRODUCER)
  C --> |"signBsff(TRANSPORT)"| D(SENT)
  D -->|"signBsff(TRANSPORT)"| E(SENT)
  E -->|"signBsff(TRANSPORT)"| G(SENT)
  G -->|"signBsff(RECEPTION)"|H(RECEIVED)
  H -->|updateBsffPackaging|H
  I(RECEIVED) -->|"signBsff(ACCEPTATION)"|J(ACCEPTED)
  J -->|updateBsffPackaging|K(ACCEPTED)
  K -->|"signBsff(OPERATION)"|L(INTERMEDIATELY_PROCESSED)
  `
};

export default workflow;
