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
