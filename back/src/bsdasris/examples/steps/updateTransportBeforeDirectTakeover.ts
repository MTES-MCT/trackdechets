import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateTransportBeforeDirectTakeover(
  company: string
): WorkflowStep {
  return {
    description: `Les informations de transport sont complétées. Le producteur ayant autorisé l'emport direct de dasri, le transporteur peut signer l'enlèvement du déchet sans signature producteur`,
    mutation: mutations.updateBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { transporter: { transport: fixtures.transportInput } }
    }),
    expected: { status: "INITIAL" },
    data: response => response.updateBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
