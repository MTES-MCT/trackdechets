import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateOperationForGrouping(company: string): WorkflowStep {
  return {
    description: `Les informations de l'opération sont complétées avec un code de groupement`,
    mutation: mutations.updateBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { destination: { operation: fixtures.operationForGroupingInput } }
    }),
    expected: { status: "RECEIVED" },
    data: response => response.updateBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
