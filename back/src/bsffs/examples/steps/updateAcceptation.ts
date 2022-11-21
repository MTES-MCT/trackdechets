import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function updateAcceptation(
  company: string,
  { packagingIdx }
): WorkflowStep {
  return {
    description: `Les informations sur l'acceptation du contenant sont complétées`,
    mutation: mutations.updateBsffPackaging,
    variables: ({ packagings }) => ({
      id: packagings[packagingIdx].id,
      input: {
        acceptation: {
          date: "2022-11-04",
          weight: 1,
          status: "ACCEPTED",
          wasteCode: "14 06 01*",
          wasteDescription: "R404A"
        }
      }
    }),
    expected: { acceptation: { date: "2022-11-04T00:00:00.000Z" } },
    data: response => response.updateBsffPackaging,
    company
  };
}
