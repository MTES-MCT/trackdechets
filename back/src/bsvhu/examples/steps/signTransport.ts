import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signTransport(company: string): WorkflowStep {
  return {
    description: `Le transporteur procède ensuite à la signature`,
    mutation: mutations.signBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "TRANSPORT",
        author: "Patrick"
      }
    }),
    expected: { status: "SENT" },
    data: response => response.signBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
