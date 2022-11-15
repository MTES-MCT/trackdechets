import { Workflow } from "../../../common/workflow";
import { signEmission } from "../steps/signEmission";
import { updateTransport } from "../steps/updateTransport";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { signReception } from "../steps/signReception";
import { updateAcceptation } from "../steps/updateAcceptation";
import { signAcceptation } from "../steps/signAcceptation";
import {
  updateOperationR2,
  updateOperationR12
} from "../steps/updateOperation";
import { signOperation } from "../steps/signOperation";
import collecteFluidesParOperateur from "./collecteFluidesParOperateur";
import { createGroupementBsff } from "../steps/createGroupementBsff";
import { bsffPackagings } from "../steps/bsffPackagings";

const workflow: Workflow = {
  title:
    "Une installation collecte des contenants de fluides pour les grouper et réaliser un seul bordereau de suivi.",
  description:
    "L’installation va choisir les bordereaux en attente sur Trackdéchets pour lesquels un" +
    " groupement avait été indiqué comme opération précédente. \n \n" +
    " Cette installation s'identifie comme émettrice du BSFF de groupement, renseigne les autres informations requises" +
    " (déchet, transporteur, destinataire) et peut faire accompagner les contenants par ce seul" +
    " bordereau. \n \n" +
    " Dans cet exemple les deux contenants présents sur le bordereau de groupement auront un traitement différent : \n" +
    "- le fluide du premier contenant est régénéré.\n" +
    "- le fluide du second contenant est reconditionné avant envoi vers un centre de traitement pour destruction.\n",
  companies: [
    { name: "detenteur1", companyTypes: ["PRODUCER"] },
    { name: "detenteur2", companyTypes: ["PRODUCER"] },
    { name: "operateur", companyTypes: ["PRODUCER"] },
    { name: "ttr", companyTypes: ["COLLECTOR"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] },
    { name: "destructeur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    ...collecteFluidesParOperateur.steps.map(s => ({ ...s, hideInDoc: true })),
    ...collecteFluidesParOperateur.steps.map(s => ({ ...s, hideInDoc: true })),
    bsffPackagings("ttr"),
    createGroupementBsff("ttr"),
    signEmission("ttr"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("traiteur"),
    signReception("traiteur"),
    {
      ...updateAcceptation("traiteur", { packagingIdx: 0 }),
      description:
        "Les informations sur l'acceptation du contenant n°1 sont complétées"
    },
    {
      ...updateAcceptation("traiteur", { packagingIdx: 1 }),
      description:
        "Les informations sur l'acceptation du contenant n°2 sont complétées"
    },
    {
      ...signAcceptation("traiteur"),
      description:
        "L'installation de traitement signe l'acceptation des contenants." +
        " Il aurait également été possible de signer l'acceptation de chaque contenant" +
        " séparément en spécifiant le paramètre `BsffSignatureInput.packagingId`"
    },
    {
      ...updateOperationR2("traiteur", { packagingIdx: 0 }),
      description: "Le contenant n°1 part en régénération"
    },
    {
      ...updateOperationR12("traiteur", { packagingIdx: 1 }),
      description:
        "Le déchet du contenant n°2 contient un % trop important d'impureté" +
        " et va être détruit après un reconditionnement dans un plus grand contenant." +
        " Il est également possible ici de spécifier une rupture de traçabilité avec le " +
        " paramètre `noTraceability`"
    },
    {
      ...signOperation("traiteur"),
      description:
        "L'installation de traitement signe l'opération des contenants." +
        " Il aurait également été possible de signer l'opération de chaque contenant" +
        " séparément en spécifiant le paramètre `BsffSignatureInput.packagingId`"
    }
  ],
  docContext: {
    operateur: { siret: "SIRET_OPERATEUR" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    ttr: { siret: "SIRET_TTR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    destructeur: { siret: "SIRET_INSTALLATION_DESTRUCTION" },
    bsff: { id: "ID_BSFF" },
    packagings: [{ id: "ID_PACKAGING_1" }, { id: "ID_PACKAGING_2" }],
    initialBsffs: [
      { packagings: [{ id: "ID_PACKAGING_1" }] },
      { packagings: [{ id: "ID_PACKAGING_2" }] }
    ]
  },
  chart: `
graph LR
B(NO STATE) -->|"createBsff (type=GROUPEMENT)"| C(INITIAL)
C -->|updateBsff|C
C -->|"signBsff(EMISSION)"|D(SIGNED_BY_EMITTER)
D -->|updateBsff|D
D -->|"signBsff(TRANSPORT)"|F(SENT)
F -->|updateBsff|F
G(SENT) -->|"signBsff(RECEPTION)"|H(RECEIVED)
H -->|"updateBsffPackaging (contenant n°1)"|H
H -->|"updateBsffPackaging (contenant n°2)"|H
H -->|"signBsff(ACCEPTATION)"|I(ACCEPTED)
I -->|"updateBsffPackaging (contenant n°1)"|I
I -->|"updateBsffPackaging (contenant n°2)"|I
I -->|"signBsff(OPERATION)"|J(INTERMEDIATELY_PROCESSED)
`
};

export default workflow;
