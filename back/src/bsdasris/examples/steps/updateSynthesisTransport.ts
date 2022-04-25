import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateSynthesisTransport(company: string): WorkflowStep {
  return {
    description: `Les informations de transport du dasri de synthèse sont complétées`,
    mutation: mutations.updateBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { transporter: { transport: fixtures.synthesisTransportInput } }
    }),
    expected: { status: "INITIAL" },
    data: response => response.updateBsdasri,
    company,
    setContext: (ctx, data) => {
      return { ...ctx, bsd: data };
    }
  };
}
