import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function updateBsvhuTransporter(
  company: string,
  number: number,
  getInput: (ctx) => any
): WorkflowStep {
  return {
    description: "Mise à jour des informations du transporteur",
    mutation: mutations.updateBsvhuTransporter,
    variables: context => {
      const bsvhuTransporterId = context.bsvhuTransporters[number - 1];
      return {
        id: bsvhuTransporterId,
        input: getInput(context)
      };
    },
    data: response => response.updateBsvhuTransporter,
    company
  };
}
