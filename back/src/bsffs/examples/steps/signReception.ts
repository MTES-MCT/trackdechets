import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function signReception(company: string): WorkflowStep {
  return {
    description: `Le destinataire signe la réception du BSFF`,
    mutation: mutations.signBsff,
    variables: ({ bsff }) => ({
      id: bsff.id,
      input: {
        type: "RECEPTION",
        author: "Jean Transit"
      }
    }),
    expected: { status: "RECEIVED" },
    data: response => response.signBsff,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsff: data })
  };
}
