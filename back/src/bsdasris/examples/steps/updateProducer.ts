import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function updateProducer(company: string): WorkflowStep {
  return {
    description: `Les informations de transport sont complétées`,
    mutation: mutations.updateBsdasri,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: { transport: fixtures.transportInput }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.updateBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
