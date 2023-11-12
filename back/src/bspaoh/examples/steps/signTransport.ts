import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signTransport(company: string): WorkflowStep {
  return {
    description: `Le transporteur signe le PAOH`,
    mutation: mutations.signBspaoh,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "TRANSPORT",
        author: "Jason Statham"
      }
    }),
    expected: { status: "SENT" },
    data: response => response.signBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
