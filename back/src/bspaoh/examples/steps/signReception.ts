import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signReception(company: string): WorkflowStep {
  return {
    description: `Le crématorium signe les informations de réception`,
    mutation: mutations.signBspaoh,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "RECEPTION",
        author: "Bob"
      }
    }),
    expected: { status: "RECEIVED" },
    data: response => response.signBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
