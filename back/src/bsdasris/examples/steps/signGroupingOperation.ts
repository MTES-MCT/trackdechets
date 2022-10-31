import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signGroupingOperation(company: string): WorkflowStep {
  return {
    description: `Le traiteur signe les informations de l'opération`,
    mutation: mutations.signBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "OPERATION",
        author: "John"
      }
    }),
    expected: { status: "AWAITING_GROUP" },
    data: response => response.signBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
