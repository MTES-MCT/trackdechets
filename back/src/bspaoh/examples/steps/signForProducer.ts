import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signForProducer(company: string): WorkflowStep {
  return {
    description: `L'émetteur signe le PAOH`,
    mutation: mutations.signBspaoh,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "EMISSION",
        author: "Marcel Producteur"
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.signBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
