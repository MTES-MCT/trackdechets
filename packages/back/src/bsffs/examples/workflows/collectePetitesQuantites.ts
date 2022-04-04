import { Workflow } from "../../../common/workflow";
import { createFicheIntervention } from "../steps/createFicheIntervention";

const workflow: Workflow = {
  title: "Collecte de fluides par un opérateur",
  description: `Un opérateur qui collecte des fluides lors d'opérations sur les équipements de ses
  clients. Il établit une ou des fiches d’intervention pour les détenteurs d’équipements.`,
  companies: [
    { name: "detenteur1", companyTypes: ["PRODUCER"] },
    { name: "detenteur2", companyTypes: ["PRODUCER"] },
    { name: "operateur", companyTypes: ["PRODUCER"] },
    { name: "transporteur", companyTypes: ["TRANSPORTER"] },
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
        detenteur: "detenteur1",
        numero: "FI-1"
      }),
      description:
        "L'opérateur renseigne les informations d'une dexuième fiche d'intervention. " +
        "Cette étape peut être répétée autant de fois que l'on veut pour renseigner N fiches d'intervention"
    }
  ],
  docContext: {
    detenteur1: { siret: "SIRET_DETENTEUR_1" },
    detenteur2: { siret: "SIRET_DETENTEUR_2" },
    operateur: { siret: "SIRET_OPERATEUR" },
    transporteur: { siret: "SIRET_TRANSPORTEUR" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    bsff: { id: "ID_BSFF" }
  },
  chart: `
graph LR
AO(NO STATE) -->|createFicheInterventionBsff| B(FI CREATED)
AO(NO STATE) -->|createFicheInterventionBsff| B`
};

export default workflow;
