import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function updateBsdaTransporter(
  company: string,
  number: number,
  getInput: (ctx) => any
): WorkflowStep {
  return {
    description: "Mise à jour des informations du transporteur",
    mutation: mutations.updateBsdaTransporter,
    variables: context => {
      const bsdaTransporterId = context.bsdaTransporters[number - 1];
      return {
        id: bsdaTransporterId,
        input: getInput(context)
      };
    },
    data: response => response.updateBsdaTransporter,
    company
  };
}
