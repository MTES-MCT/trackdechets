import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signForEcoOrganisme(company: string): WorkflowStep {
  return {
    description: `L'éco-organisme signe le BSDASRI`,
    mutation: mutations.signBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        type: "EMISSION",
        author: "Mr Martin"
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.signBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data, bsdasri1: data })
  };
}
