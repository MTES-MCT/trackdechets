import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function signTransport(company: string): WorkflowStep {
  return {
    description: `Le transporteur signe le BSFF`,
    mutation: mutations.signBsff,
    variables: ({ bsff }) => ({
      id: bsff.id,
      input: {
        type: "TRANSPORT",
        author: "Jean Transporteur"
      }
    }),
    expected: { status: "SENT" },
    data: response => response.signBsff,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsff: data })
  };
}
