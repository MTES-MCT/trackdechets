import { Workflow } from "../../../common/workflow";
import { createFicheIntervention } from "../steps/createFicheIntervention";
import { createBsff } from "../steps/createBsff";
import { signEmission } from "../steps/signEmission";
import { updateTransport } from "../steps/updateTransport";
import { signTransport } from "../steps/signTransport";
import { updateReception } from "../steps/updateReception";
import { signReception } from "../steps/signReception";
import { updateAcceptation } from "../steps/updateAcceptation";
import { signAcceptation } from "../steps/signAcceptation";
import { updateOperationD13 } from "../steps/updateOperation";
import { signOperation } from "../steps/signOperation";

const workflow: Workflow = {
  title: "Collecte de fluides par un opérateur avec un transporteur étranger",
  description:
    "Un opérateur qui collecte des fluides lors d'opérations sur les équipements de ses" +
    " clients. Il établit une ou des fiches d’intervention pour les détenteurs d’équipements. \n \n" +
    " Lorsqu’il souhaite renvoyer le(s) contenant(s) à son fournisseur, l’opérateur crée un" +
    " bordereau FF sur Trackdéchets. Il rapporte les renseignements clés des FI sur ce" +
    " bordereau, ainsi que les informations des contenants." +
    " Lorsque le bordereau est finalisé, il permet d’accompagner le ou les contenants de fluides." +
    " Un bordereau doit servir de traçabilité pour un même fluide (pas de mélange)." +
    " Le bordereau est signé par l’opérateur, le transporteur et l’entreprise de destination finale qui" +
    " indique l’opération réalisée. Le BSFF est mis à disposition sur (ou via) Trackdéchets, à" +
    " toutes les entreprises visées sur le bordereau. \n",
  companies: [
    { name: "detenteur1", companyTypes: ["PRODUCER"] },
    { name: "detenteur2", companyTypes: ["PRODUCER"] },
    { name: "operateur", companyTypes: ["PRODUCER"] },
    {
      name: "transporteur",
      companyTypes: ["TRANSPORTER"],
      opt: {
        siret: null,
        vatNumber: "BE0541696005"
      }
    },
    { name: "ttr", companyTypes: ["COLLECTOR"] },
    { name: "traiteur", companyTypes: ["WASTEPROCESSOR"] }
  ],
  steps: [
    {
      ...createFicheIntervention("operateur", {
        detenteur: "detenteur1",
        numero: "FI-1"
      }),
      description:
        "L'opérateur renseigne les informations d'une première fiche d'intervention"
    },
    {
      ...createFicheIntervention("operateur", {
        detenteur: "detenteur2",
        numero: "FI-2"
      }),
      description:
        "L'opérateur renseigne les informations d'une deuxième fiche d'intervention. " +
        "Cette étape peut être répétée autant de fois que l'on veut pour renseigner N fiches d'intervention"
    },
    {
      ...createBsff("operateur"),
      description: `L'opérateur crée un BSFF en liant les fiches d'intervention par leur identifiant Trackdéchets`
    },
    signEmission("operateur"),
    updateTransport("transporteur"),
    signTransport("transporteur"),
    updateReception("ttr"),
    signReception("ttr"),
    updateAcceptation("ttr", { packagingIdx: 0 }),
    signAcceptation("ttr"),
    updateOperationD13("ttr", { packagingIdx: 0 }),
    signOperation("ttr")
  ],
  docContext: {
    detenteur1: { siret: "SIRET_DETENTEUR_1" },
    detenteur2: { siret: "SIRET_DETENTEUR_2" },
    operateur: { siret: "SIRET_OPERATEUR" },
    transporteur: { vatNumber: "VAT_TRANSPORTEUR" },
    ttr: { siret: "SIRET_TTR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsff: { id: "ID_BSFF" },
    ficheInterventions: [{ id: "ID_FI_1" }, { id: "ID_FI_2" }],
    packagings: [{ id: "ID_PACKAGING_1" }]
  },
  chart: `
graph LR
AO(NO STATE) -->|createFicheInterventionBsff| B(FI CREATED)
AO(NO STATE) -->|createFicheInterventionBsff| B
B -->|createBsff| C(INITIAL)
C -->|updateBsff|C
C -->|"signBsff(EMISSION)"|D(SIGNED_BY_EMITTER)
D -->|updateBsff|D
D -->|"signBsff(TRANSPORT)"|F(SENT)
F -->|updateBsff|F
G(SENT) -->|"signBsff(RECEPTION)"|H(RECEIVED)
H -->|updateBsffPackaging|H
H -->|"signBsff(ACCEPTATION)"|I(ACCEPTED)
I -->|updateBsffPackaging|I
I -->|"signBsff(OPERATION)"|J(INTERMEDIATELY_PROCESSED)
`
};

export default workflow;
