import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateDelivery(company: string): WorkflowStep {
  return {
    description: `Les informations du depot sont complétées`,
    mutation: mutations.updateBspaoh,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { destination: fixtures.handedOverToDestinationInput }
    }),
    expected: { status: "SENT" },
    data: response => response.updateBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
