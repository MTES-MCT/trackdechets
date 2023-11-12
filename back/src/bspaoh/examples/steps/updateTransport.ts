import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateTransport(company: string): WorkflowStep {
  return {
    description: `Les informations de transport sont complétées`,
    mutation: mutations.updateBspaoh,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { transporter: { transport: fixtures.transportUpdateInput } }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.updateBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
