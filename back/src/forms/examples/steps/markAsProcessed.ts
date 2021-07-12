import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";
import fixtures from "../fixtures";

export function markAsProcessed(company: string): WorkflowStep {
  return {
    description: `L'opération d'élimination / valorisation est effectuée
      par l'installation de destination prévue`,
    mutation: mutations.markAsProcessed,
    variables: ({ bsd }) => ({
      id: bsd.id,
      processedInfo: fixtures.processedInfoInput
    }),
    expected: { status: "PROCESSED" },
    data: response => response.markAsProcessed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
