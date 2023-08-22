import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function updateFormTransporterPlates(
  company: string,
  number: number
): WorkflowStep {
  return {
    description: "Le transporteur met à jour sa plaque d'immatriculation",
    mutation: mutations.updateFormTransporter,
    variables: context => {
      const formTransporterId = context.formTransporters[number - 1];
      return {
        id: formTransporterId,
        input: { numberPlate: "AG-567-BS" }
      };
    },
    data: response => response.updateFormTransporter,
    company
  };
}
