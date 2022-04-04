import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signTransport(company: string): WorkflowStep {
  return {
    description: `Le transporteur signe le BSDASRI`,
    mutation: mutations.signBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "TRANSPORT",
        author: "John"
      }
    }),
    expected: { status: "SENT" },
    data: response => response.signBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data, bsdasri1: data })
  };
}
