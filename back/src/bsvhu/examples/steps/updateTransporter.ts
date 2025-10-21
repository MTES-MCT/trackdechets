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

export function updateTransporters(company: string): WorkflowStep {
  return {
    description: "Un transporteur est ajouté",
    mutation: mutations.updateBsvhu,
    variables: ({ bsd, updatedBsvhuTransporters }) => ({
      id: bsd.id,
      input: {
        transporters: updatedBsvhuTransporters
      }
    }),
    data: response => response.updateBsvhu,
    company,
    setContext: ctx => ({
      ...ctx,
      bsvhuTransporters: ctx.updatedBsvhuTransporters,
      updatedBsvhuTransporters: undefined
    })
  };
}
