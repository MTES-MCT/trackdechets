import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signReception(company: string): WorkflowStep {
  return {
    description: `Le traiteur signe les informations de réception`,
    mutation: mutations.signBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "RECEPTION",
        author: "Bob"
      }
    }),
    expected: { status: "RECEIVED" },
    data: response => response.signBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
