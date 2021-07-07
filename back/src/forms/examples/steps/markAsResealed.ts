import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function markAsResealed(company: string): WorkflowStep {
  return {
    description: `Complète et valide les cadres 13 à 19`,
    mutation: mutations.markAsResealed,
    variables: ({ bsd, transporteur2 }) => ({
      id: bsd.id,
      resealedInfos: fixtures.resealedInfosInput(transporteur2.siret)
    }),
    expected: { status: "RESEALED" },
    data: response => response.markAsResealed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
