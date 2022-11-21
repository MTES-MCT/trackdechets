import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function updateReception(company: string): WorkflowStep {
  return {
    description: `Les informations sur la réception sont complétées`,
    mutation: mutations.updateBsff,
    variables: ({ bsff }) => ({
      id: bsff.id,
      input: {
        destination: {
          reception: {
            date: "2022-11-03"
          }
        }
      }
    }),
    expected: { status: "SENT" },
    data: response => response.updateBsff,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsff: data })
  };
}
