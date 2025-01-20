import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signOperation(company: string): WorkflowStep {
  return {
    description: `Le broyeur procède ensuite à la signature de la réception (étape facultative)`,
    mutation: mutations.signBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "RECEPTION",
        author: "Henri Broyeur"
      }
    }),
    expected: { status: "RECEIVED" },
    data: response => response.signBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
