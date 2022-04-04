import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createBsdasri(company: string): WorkflowStep {
  return {
    description: `Les informations du BSDASRI (PRED, transporteur, destinataire, déchets) sont remplies.`,
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
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
