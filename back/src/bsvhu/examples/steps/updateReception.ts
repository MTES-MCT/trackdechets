import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateReception(company: string): WorkflowStep {
  return {
    description: `Le broyeur renseigne les données de réception (étape facultative)`,
    mutation: mutations.updateBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        destination: {
          reception: fixtures.receptionInput
        }
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.updateBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
