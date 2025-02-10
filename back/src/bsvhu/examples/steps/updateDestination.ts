import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateDestination(company: string): WorkflowStep {
  return {
    description: `Le broyeur renseigne les données de traitement`,
    mutation: mutations.updateBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        destination: {
          operation: fixtures.operationInput
        }
      }
    }),
    expected: { status: "RECEIVED" },
    data: response => response.updateBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
