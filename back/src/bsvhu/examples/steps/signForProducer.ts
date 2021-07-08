import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signForProducer(company: string): WorkflowStep {
  return {
    description: `Le producteur procède ensuite à la signature`,
    mutation: mutations.signBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "EMISSION",
        author: "Jean VHU"
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.signBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
