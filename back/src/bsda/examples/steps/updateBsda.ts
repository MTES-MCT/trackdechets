import { WorkflowStep } from "../../../common/workflow";
import { BsdaInput } from "../../../generated/graphql/types";
import mutations from "../mutations";

export function updateBsda(
  company: string,
  getInput: (ctx) => BsdaInput
): WorkflowStep {
  return {
    description: `Mise à jour des informations du BSDA.`,
    mutation: mutations.updateBsda,
    variables: ctx => ({
      id: ctx.bsda.id,
      input: getInput(ctx)
    }),
    expected: { },
    data: response => response.updateBsda,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsda: data })
  };
}
