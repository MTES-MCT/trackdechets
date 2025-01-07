import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateTransporter(company: string): WorkflowStep {
  return {
    description: `Le transporteur complète ensuite ses données`,
    mutation: mutations.updateBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        transporter: {
          recepisse: fixtures.receiptInput,
          transport: fixtures.platesInput
        }
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.updateBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}

export function updateForeignTransporter(company: string): WorkflowStep {
  return {
    description: `Le transporteur complète ensuite ses données`,
    mutation: mutations.updateBsvhu,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        transporter: {
          transport: fixtures.platesInput
        }
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.updateBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
