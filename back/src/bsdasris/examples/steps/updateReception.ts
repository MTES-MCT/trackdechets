import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateReception(company: string): WorkflowStep {
  return {
    description: `Les informations de réception sont complétées`,
    mutation: mutations.updateBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { destination: { reception: fixtures.receptionInput } }
    }),
    expected: { status: "SENT" },
    data: response => response.updateBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
