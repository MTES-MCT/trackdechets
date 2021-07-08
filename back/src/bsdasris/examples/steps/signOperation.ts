import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signOperation(company: string): WorkflowStep {
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
    expected: { status: "PROCESSED" },
    data: response => response.signBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
