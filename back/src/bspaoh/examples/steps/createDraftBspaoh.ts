import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createDraftBspaoh(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: `Les informations du BSPAOH (émetteur, transporteur, crématorium, déchets) sont remplies.`,
    mutation: mutations.createDraftBspaoh,
    variables: ({ emetteur, transporteur, crematorium }) => ({
      input: {
        ...fixtures.wasteInput,
        emitter: {
          ...fixtures.emitterInput(emetteur.siret),
          emission: fixtures.emissionInput
        },
        destination: fixtures.destinationInput(crematorium.siret),
        transporter: fixtures.transporterInput(
          transporteur.siret?.length
            ? transporteur.siret
            : transporteur.vatNumber
        )
      }
    }),
    expected: { status: "INITIAL", isDraft: true },
    data: response => response.createDraftBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
