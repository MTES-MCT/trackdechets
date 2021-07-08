import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function markAsReceived(company: string): WorkflowStep {
  return {
    description: `Le déchet est receptionné et accepté
      sur l'installation de destination prévue`,
    mutation: mutations.markAsReceived,
    variables: ({ bsd }) => ({
      id: bsd.id,
      receivedInfo: fixtures.receivedInfoInput
    }),
    expected: { status: "ACCEPTED" },
    data: response => response.markAsReceived,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
