import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function createBsff(
  company: string,
  { detenteur: detenteurId, numero }
): WorkflowStep {
  return {
    description: `L'opérateur crée un BSFF en liant les fiches d'intervention`,
    mutation: mutations.createBsff,
    variables: ({ operateur, ...vars }) => {
      const detenteur = vars[detenteurId];
      return {
        input: {
          weight: 1,
          operateur: fixtures.operateurInput(operateur.siret),
          detenteur: fixtures.detenteurInput(detenteur.siret),
          numero,
          postalCode: "13001"
        }
      };
    },
    expected: { numero },
    data: response => response.createFicheInterventionBsff,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      ficheInterventions: [...(ctx.ficheInterventions ?? []), data]
    })
  };
}
