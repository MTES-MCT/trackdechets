import { WorkflowStep } from "../../../common/workflow";
import fixtures from "../fixtures";
import mutations from "../mutations";

export function createGroupingBsda(company: string): WorkflowStep {
  return {
    description: `Création d'un bordereau initial (amené à être groupé)`,
    mutation: mutations.createBsda,
    variables: ({ transporteur, traiteur, traiteur2, ...ctx }) => ({
      input: {
        type: "GATHERING",
        emitter: fixtures.emitterInput(traiteur.siret),
        destination: fixtures.destinationInput(traiteur2.siret),
        transporter: fixtures.transporterInput(transporteur.siret),
        waste: fixtures.wasteInput(),
        packagings: fixtures.packagingsInput(),
        weight: fixtures.weightInput(),
        grouping: [ctx.bsda_1.id, ctx.bsda_2.id]
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createBsda,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsda: data })
  };
}
