import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function updateBsda(
  company: string,
  getInput: (ctx) => any
): WorkflowStep {
  return {
    description: `Mise à jour des informations du BSDA.`,
    mutation: mutations.updateBsda,
    variables: ctx => ({
      id: ctx.bsda.id,
      input: getInput(ctx)
    }),
    expected: {},
    data: response => response.updateBsda,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsda: data })
  };
}

export function updateBsdaTransporters(company: string): WorkflowStep {
  return {
    description: "Un transporteur est ajouté",
    mutation: mutations.updateBsda,
    variables: ({ bsda, updatedBsdaTransporters }) => ({
      id: bsda.id,
      input: {
        transporters: updatedBsdaTransporters
      }
    }),
    data: response => response.updateBsda,
    company,
    setContext: ctx => ({
      ...ctx,
      bsdaTransporters: ctx.updatedBsdaTransporters,
      updatedBsdaTransporters: undefined
    })
  };
}
