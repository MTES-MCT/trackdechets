import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function markAsResealed(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: `Complète et valide les cadres 13 à 19`,
    mutation: mutations.markAsResealed,
    variables: ({ bsd, transporteur2 }) => ({
      id: bsd.id,
      resealedInfos: fixtures.resealedInfosInput(
        transporteur2.siret?.length
          ? transporteur2.siret
          : transporteur2.vatNumber
      )
    }),
    expected: { status: "RESEALED" },
    data: response => response.markAsResealed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
