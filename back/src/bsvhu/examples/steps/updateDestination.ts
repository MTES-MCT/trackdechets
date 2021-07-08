import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateDestination(company: string): WorkflowStep {
  return {
    description: `Le broyeur édite ses données`,
    mutation: mutations.updateBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        destination: {
          reception: fixtures.receptionInput,
          operation: fixtures.operationInput
        }
      }
    }),
    expected: { status: "SENT" },
    data: response => response.updateBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
