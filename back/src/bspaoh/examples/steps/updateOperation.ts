import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateOperation(company: string): WorkflowStep {
  return {
    description: `Les informations de l'opération sont complétées`,
    mutation: mutations.updateBspaoh,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { destination: { operation: fixtures.operationInput } }
    }),
    expected: { status: "RECEIVED" },
    data: response => response.updateBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
