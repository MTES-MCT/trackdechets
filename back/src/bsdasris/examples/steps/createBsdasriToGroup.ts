import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createBsdasri1ToGroup(company: string): WorkflowStep {
  return {
    description: `On prépare un premier bordereau destiné à être associé à un bordereau de groupement.
    Les informations du BSDASRI (PRED, transporteur, destinataire, déchets) sont remplies.
    Puis, il va suivre son cycle de vie jusqu'à la signature de traitement par le destinataire (status AWAITING_GROUP)`,
    mutation: mutations.createBsdasri,
    variables: ({ pred, transporteur, traiteur }) => ({
      input: {
        ...fixtures.wasteInput,
        emitter: {
          ...fixtures.emitterInput(pred.siret),
          emission: fixtures.emissionInput
        },
        destination: fixtures.destinationInput(traiteur.siret),
        transporter: fixtures.transporterInput(transporteur.siret)
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data, bsdasri1: data })
  };
}

export function createBsdasri2ToGroup(company: string): WorkflowStep {
  return {
    description: `On prépare un second bordereau destiné à être associé à un bordereau de groupement.
    Les informations du BSDASRI (PRED, transporteur, destinataire, déchets) sont remplies.
    Puis, il va suivre son cycle de vie jusqu'à la signature de traitement par le destinataire (status AWAITING_GROUP)`,

    mutation: mutations.createBsdasri,
    variables: ({ pred, transporteur, traiteur }) => ({
      input: {
        ...fixtures.wasteInput,
        emitter: {
          ...fixtures.emitterInput(pred.siret),
          emission: fixtures.emissionInput
        },
        destination: fixtures.destinationInput(traiteur.siret),
        transporter: fixtures.transporterInput(transporteur.siret)
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data, bsdasri2: data })
  };
}
