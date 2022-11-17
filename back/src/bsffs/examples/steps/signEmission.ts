import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function signEmission(company: string): WorkflowStep {
  return {
    description: `L'émetteur signe le BSFF`,
    mutation: mutations.signBsff,
    variables: ({ bsff }) => ({
      id: bsff.id,
      input: {
        type: "EMISSION",
        author: "Jean Opérateur"
      }
    }),
    expected: { status: "SIGNED_BY_EMITTER" },
    data: response => response.signBsff,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsff: data })
  };
}
