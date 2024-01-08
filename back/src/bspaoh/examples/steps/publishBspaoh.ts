import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function publishBspaoh(company: string): WorkflowStep {
  return {
    description: `L'émetteur publie le PAOH`,
    mutation: mutations.publishBspaoh,
    variables: ({ bsd }) => ({
      id: bsd.id
    }),
    expected: { status: "INITIAL", isDraft: false },
    data: response => response.publishBspaoh,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
