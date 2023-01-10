import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createBsdasri(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
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
        transporter: fixtures.transporterInput(
          transporteur.siret?.length
            ? transporteur.siret
            : transporteur.vatNumber
        )
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
