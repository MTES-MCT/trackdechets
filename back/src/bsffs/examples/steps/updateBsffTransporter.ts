import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function updateBsffTransporter(
  company: string,
  number: number,
  getInput: (ctx) => any
): WorkflowStep {
  return {
    description: "Mise à jour des informations du transporteur",
    mutation: mutations.updateBsffTransporter,
    variables: context => {
      const bsffTransporterId = context.bsffTransporters[number - 1];
      return {
        id: bsffTransporterId,
        input: getInput(context)
      };
    },
    data: response => response.updateBsffTransporter,
    company
  };
}
