import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function updateBsffTransporters(company: string): WorkflowStep {
  return {
    description: "Un transporteur est ajouté",
    mutation: mutations.updateBsff,
    variables: ({ bsff, updatedBsffTransporters }) => ({
      id: bsff.id,
      input: {
        transporters: updatedBsffTransporters
      }
    }),
    data: response => response.updateBsff,
    company,
    setContext: ctx => ({
      ...ctx,
      bsffTransporters: ctx.updatedBsffTransporters,
      updatedBsffTransporters: undefined
    })
  };
}
