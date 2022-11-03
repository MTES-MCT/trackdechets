import { WorkflowStep } from "../../../common/workflow";
import fixtures from "../fixtures";
import mutations from "../mutations";

export function updateOperation(
  company: string,
  { packagingIdx }
): WorkflowStep {
  return {
    description: `Les informations sur l'opération effectuée sur le contenant sont complétées`,
    mutation: mutations.updateBsffPackaging,
    variables: ({ packagings, traiteur }) => ({
      id: packagings[packagingIdx].id,
      input: {
        operation: {
          date: "2022-11-05",
          code: "D13",
          description: "Regroupement",
          nextDestination: fixtures.nextDestinationInput(traiteur.siret)
        }
      }
    }),
    expected: { acceptation: { date: "2022-11-04T00:00:00.000Z" } },
    data: response => response.updateBsffPackaging,
    company
  };
}
