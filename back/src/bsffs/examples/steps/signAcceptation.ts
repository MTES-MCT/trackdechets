import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function signAcceptation(company: string): WorkflowStep {
  return {
    description: `Le destinataire signe l'acceptation des contenants présents sur le BSFF`,
    mutation: mutations.signBsff,
    variables: ({ bsff }) => ({
      id: bsff.id,
      input: {
        type: "ACCEPTATION",
        author: "Jean Dupont"
      }
    }),
    expected: { status: "ACCEPTED" },
    data: response => response.signBsff,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsff: data })
  };
}
