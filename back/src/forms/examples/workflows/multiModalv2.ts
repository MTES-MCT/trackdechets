import { createFormWithTransporters } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsProcessed } from "../steps/markAsProcessed";
import { Workflow } from "../../../common/workflow";
import { signEmissionForm } from "../steps/signEmissionForm";
import { signTransportForm } from "../steps/signTransportForm";
import { createFormTransporter } from "../steps/createFormTransporter";
import { updateFormTransporterPlates } from "../steps/updateFormTransporter";
import { updateFormTransporters } from "../steps/updateForm";

const workflow: Workflow = {
  title: "Transport multi-modal (amélioration juillet 2023)",
  description:
    "En cas de transport multi-modal, plusieurs transporteurs peuvent être renseignés dans un ordre donné " +
    "grâce au champ `transporters`. Les transporteurs signent chacun à leur tour grâce à la mutation `signTransportForm`. " +
    "La liste des transporteurs peut être modifiée par n'importe quel acteur du bordereau tant que le bordereau " +
    "n'a pas été réceptionné sur l'installation de destination. À noter toutefois qu'un transporteur ne peut plus " +
    "être modifié ou supprimé dès lors qu'il a signé le bordereau." +
    "\n" +
    "Ce workflow est plus flexible que le premier workflow faisant appel aux mutations `prepareSegment`, `markSegmentAsReadyToTakeOver`" +
    " et `takeOverSegment` car il permet à chaque acteur du bordereau d'ajouter de nouveaux transporteurs à tout moment.",
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    { name: "transporteur3", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    {
      ...createFormTransporter("producteur", "transporteur1"),
      description: "Crée un premier transporteur qui sera associé au bordereau."
    },
    {
      ...createFormTransporter("producteur", "transporteur2"),
      description: "Crée un second transporteur qui sera associé au bordereau."
    },
    createFormWithTransporters("producteur"),
    markAsSealed("producteur"),
    signEmissionForm("producteur"),
    {
      ...signTransportForm("transporteur1"),
      description: "Le premier transporteur signe le bordereau"
    },
    {
      ...updateFormTransporterPlates("transporteur2", 2),
      description:
        "Le second transporteur met à jour sa plaque d'immatriculation"
    },
    {
      ...signTransportForm("transporteur2"),
      description: "Le second transporteur signe le bordereau"
    },
    {
      ...createFormTransporter("traiteur", "transporteur3"),
      description:
        "L'installation de destination affrète un troisième transporteur",
      setContext: (ctx, data) => ({
        ...ctx,
        updatedFormTransporters: [...ctx.formTransporters, data.id]
      })
    },
    {
      ...updateFormTransporters("traiteur"),
      description: "Le troisième transporteur est ajouté sur le bordereau"
    },
    {
      ...signTransportForm("transporteur3"),
      description: "Le troisième transporteur signe le bordereau"
    },
    markAsReceived("traiteur"),
    markAsProcessed("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR", securityCode: "XXXX" },
    transporteur1: { siret: "SIRET_TRANSPORTEUR_1" },
    transporteur2: { siret: "SIRET_TRANSPORTEUR_2" },
    transporteur3: { siret: "SIRET_TRANSPORTEUR_3" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsd: { id: "ID_BSD" },
    formTransporters: ["ID_FORM_TRANSPORTER_1", "ID_FORM_TRANSPORTER_2"],
    updatedFormTransporters: [
      "ID_FORM_TRANSPORTER_1",
      "ID_FORM_TRANSPORTER_2",
      "ID_FORM_TRANSPORTER_3"
    ]
  },
  chart: `
graph LR
NO_STATE_1(NO STATE) --> |createFormTransporter| NO_STATE_2(NO STATE)
NO_STATE_2 --> |createFormTransporter| NO_STATE_3(NO_STATE)
NO_STATE_3 --> |createForm| DRAFT
DRAFT --> |markAsSealed| SEALED
SEALED --> |signEmissionForm| SIGNED_BY_PRODUCER
SIGNED_BY_PRODUCER --> |signTransportForm| SENT1(SENT)
SENT2 --> |signTransportForm| SENT3(SENT)
SENT3 --> |createFormTransporter| SENT4(SENT)
SENT4 --> |signTransportForm| SENT5(SENT)
SENT5 --> |markAsReceived| ACCEPTED
ACCEPTED --> |markAsProcessed| PROCESSED`
};

export default workflow;
