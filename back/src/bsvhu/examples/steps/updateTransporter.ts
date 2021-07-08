import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateTransporter(company: string): WorkflowStep {
  return {
    description: `Le transporteur complète ensuite ses données`,
    mutation: mutations.updateBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { transporter: { recepisse: fixtures.receiptInput } }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.updateBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
